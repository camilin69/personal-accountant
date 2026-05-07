// src/main.cpp (Categories Service con Redis)
#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/asio/ip/tcp.hpp>
#include <boost/json.hpp>
#include <iostream>
#include <memory>
#include <ctime>
#include "category_service.hpp"
#include "database.hpp"
#include "keycloak_auth.hpp"
#include "kafka_producer.hpp"
#include "redis_client.hpp"

namespace beast = boost::beast;
namespace http = beast::http;
namespace net = boost::asio;
namespace json = boost::json;
using tcp = net::ip::tcp;

std::unique_ptr<keycloak::KeycloakClient> keycloakClient;

std::string extractToken(const http::request<http::string_body>& req) {
    auto it = req.find(http::field::authorization);
    if (it != req.end()) {
        std::string auth = std::string(it->value().begin(), it->value().end());
        if (auth.find("Bearer ") == 0) {
            return auth.substr(7);
        }
        return auth;
    }
    return "";
}

keycloak::UserInfo verifyAndGetUser(const http::request<http::string_body>& req) {
    std::string token = extractToken(req);
    if (token.empty()) {
        keycloak::UserInfo info;
        info.isValid = false;
        info.error = "No token provided";
        return info;
    }
    return keycloakClient->verifyToken(token);
}

void emitCategoryEvent(const std::string& event_type, 
                       const std::string& user_id,
                       const std::string& category_id,
                       int status_code,
                       const boost::json::object& extra_data = {}) {
    try {
        boost::json::object event;
        event["type"] = event_type;
        event["service"] = "categories";
        event["user_id"] = user_id;
        event["category_id"] = category_id;
        event["timestamp"] = std::time(nullptr);
        event["status_code"] = status_code;
        
        for (const auto& [key, value] : extra_data) {
            event[key] = value;
        }
        
        kafka::getProducer().produce("category-events", event);
        std::cout << "[Kafka] Event emitted: " << event_type << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "[Kafka] Error emitting event: " << e.what() << std::endl;
    }
}

std::string getAllowedOrigin(const http::request<http::string_body>& req) {
    const std::vector<std::string> allowedOrigins = {
        "http://localhost:5173",
        "http://localhost:3000",
        "https://tu-dominio.com"
    };
    auto it = req.find(http::field::origin);
    if (it != req.end()) {
        std::string origin = std::string(it->value().begin(), it->value().end());
        for (const auto& allowed : allowedOrigins) {
            if (origin == allowed) return origin;
        }
    }
    return "http://localhost:5173";
}

void addCorsHeaders(http::response<http::string_body>& res, 
                    const http::request<http::string_body>& req) {
    std::string origin = getAllowedOrigin(req);
    res.set(http::field::access_control_allow_origin, origin);
    res.set(http::field::access_control_allow_methods, "GET, POST, PUT, DELETE, OPTIONS");
    res.set(http::field::access_control_allow_headers, "Content-Type, Authorization, X-Requested-With");
    res.set(http::field::access_control_allow_credentials, "true");
    res.set(http::field::access_control_max_age, "86400");
}

class HttpSession : public std::enable_shared_from_this<HttpSession> {
    tcp::socket socket_;
    beast::flat_buffer buffer_;
    http::request<http::string_body> req_;
    
public:
    explicit HttpSession(tcp::socket&& socket) : socket_(std::move(socket)) {}
    void run() { read_request(); }
    
private:
    void read_request() {
        auto self = shared_from_this();
        http::async_read(socket_, buffer_, req_,
            [self](beast::error_code ec, std::size_t) {
                if (!ec) self->handle_request();
            });
    }
    
    void handle_request() {
        std::cout << "[REQUEST] " << req_.method_string() << " " << req_.target() << std::endl;

        if (req_.method() == http::verb::options) {
            http::response<http::string_body> res{http::status::ok, req_.version()};
            addCorsHeaders(res, req_);
            res.prepare_payload();
            write_response(res);
            return;
        }
        
        http::response<http::string_body> res{http::status::ok, req_.version()};
        res.set(http::field::server, "Categories Service");
        addCorsHeaders(res, req_);
        res.set(http::field::content_type, "application/json");
        
        try {
            std::string target(req_.target().begin(), req_.target().end());
            
            if (req_.method() == http::verb::get && target == "/categories/system") {
                handle_get_system_categories(res);
            }
            else if (req_.method() == http::verb::get && target == "/categories/user") {
                handle_get_user_categories(res);
            }
            else if (req_.method() == http::verb::get && target == "/categories/all") {
                handle_get_all_categories(res);
            }
            else if (req_.method() == http::verb::get && target == "/categories") {
                handle_get_all_categories(res);
            }
            else if (req_.method() == http::verb::get && target.find("/categories/") == 0 && target != "/categories/all") {
                handle_get_category_by_id(res);
            }
            else if (req_.method() == http::verb::post && target == "/categories/user") {
                handle_create_user_category(res);
            }
            else if (req_.method() == http::verb::put && target.find("/categories/user/") == 0) {
                handle_update_user_category(res);
            }
            else if (req_.method() == http::verb::delete_ && target.find("/categories/user/") == 0) {
                handle_delete_user_category(res);
            }
            else if (req_.method() == http::verb::post && target == "/categories/cache/invalidate") {
                handle_invalidate_cache(res);
            }
            else if (req_.method() == http::verb::get && target == "/health") {
                json::object response;
                response["status"] = "ok";
                response["service"] = "categories";
                response["redis"] = redis::RedisClient::getInstance().isConnected();
                res.body() = json::serialize(response);
            }
            else {
                res.result(http::status::not_found);
                json::object error;
                error["error"] = "Not Found";
                res.body() = json::serialize(error);
            }
        } catch (const std::exception& e) {
            res.result(http::status::internal_server_error);
            json::object error;
            error["error"] = e.what();
            res.body() = json::serialize(error);
        }
        
        res.prepare_payload();
        write_response(res);
    }
    
    void handle_get_system_categories(http::response<http::string_body>& res) {
        auto categories = CategoryService::getInstance().getSystemCategories();
        
        json::array categoriesArray;
        for (const auto& cat : categories) {
            json::object obj;
            obj["id"] = cat.id;
            obj["name"] = cat.name;
            obj["type"] = cat.type;
            obj["icon"] = cat.icon;
            obj["color"] = cat.color;
            obj["isSystem"] = true;
            obj["isDefault"] = true;
            obj["createdAt"] = cat.createdAt;
            categoriesArray.push_back(obj);
        }
        
        res.result(http::status::ok);
        res.body() = json::serialize(categoriesArray);
    }
    
    void handle_get_user_categories(http::response<http::string_body>& res) {
        keycloak::UserInfo userInfo = verifyAndGetUser(req_);
        if (!userInfo.isValid) {
            res.result(http::status::unauthorized);
            json::object error;
            error["error"] = "Token inválido o expirado";
            res.body() = json::serialize(error);
            return;
        }
        
        auto categories = CategoryService::getInstance().getUserCategories(userInfo.postgresId);
        
        json::array categoriesArray;
        for (const auto& cat : categories) {
            json::object obj;
            obj["id"] = cat.id;
            obj["userId"] = cat.userId;
            obj["name"] = cat.name;
            obj["type"] = cat.type;
            obj["icon"] = cat.icon;
            obj["color"] = cat.color;
            obj["isDefault"] = cat.isDefault;
            obj["isSystem"] = false;
            obj["createdAt"] = cat.createdAt;
            categoriesArray.push_back(obj);
        }
        
        res.result(http::status::ok);
        res.body() = json::serialize(categoriesArray);
    }
    
    void handle_get_all_categories(http::response<http::string_body>& res) {
        keycloak::UserInfo userInfo = verifyAndGetUser(req_);
        if (!userInfo.isValid) {
            res.result(http::status::unauthorized);
            json::object error;
            error["error"] = "Token inválido o expirado";
            res.body() = json::serialize(error);
            return;
        }
        
        auto categories = CategoryService::getInstance().getAllCategories(userInfo.postgresId);
        
        json::array allArray;
        for (const auto& cat : categories) {
            json::object obj;
            obj["id"] = cat.id;
            obj["userId"] = cat.isSystem ? "" : cat.userId;
            obj["name"] = cat.name;
            obj["type"] = cat.type;
            obj["icon"] = cat.icon;
            obj["color"] = cat.color;
            obj["isDefault"] = cat.isSystem ? true : cat.isDefault;
            obj["isSystem"] = cat.isSystem;
            obj["createdAt"] = cat.createdAt;
            allArray.push_back(obj);
        }
        
        res.result(http::status::ok);
        res.body() = json::serialize(allArray);
    }
    
    void handle_get_category_by_id(http::response<http::string_body>& res) {
        keycloak::UserInfo userInfo = verifyAndGetUser(req_);
        if (!userInfo.isValid) {
            res.result(http::status::unauthorized);
            json::object error;
            error["error"] = "Token inválido o expirado";
            res.body() = json::serialize(error);
            return;
        }
        
        std::string target(req_.target().begin(), req_.target().end());
        std::string categoryId = target.substr(16);
        
        auto category = CategoryService::getInstance().getCategoryById(categoryId, userInfo.postgresId);
        
        if (!category) {
            res.result(http::status::not_found);
            json::object error;
            error["error"] = "Categoría no encontrada";
            res.body() = json::serialize(error);
            return;
        }
        
        json::object obj;
        obj["id"] = category->id;
        obj["userId"] = category->userId;
        obj["name"] = category->name;
        obj["type"] = category->type;
        obj["icon"] = category->icon;
        obj["color"] = category->color;
        obj["isDefault"] = category->isDefault;
        obj["isSystem"] = category->isSystem;
        obj["createdAt"] = category->createdAt;
        
        res.result(http::status::ok);
        res.body() = json::serialize(obj);
    }
    
    void handle_create_user_category(http::response<http::string_body>& res) {
        keycloak::UserInfo userInfo = verifyAndGetUser(req_);
        if (!userInfo.isValid) {
            res.result(http::status::unauthorized);
            json::object error;
            error["error"] = "Token inválido o expirado";
            res.body() = json::serialize(error);
            return;
        }
        
        try {
            json::value jv = json::parse(req_.body());
            json::object& obj = jv.as_object();
            
            std::string reqType = std::string(obj.at("type").as_string());
            if (reqType != "income" && reqType != "expense") {
                res.result(http::status::bad_request);
                json::object error;
                error["error"] = "Tipo inválido. Debe ser 'income' o 'expense'";
                res.body() = json::serialize(error);
                return;
            }
            
            Category newCategory;
            newCategory.userId = userInfo.postgresId;
            newCategory.name = std::string(obj.at("name").as_string());
            newCategory.type = reqType;
            newCategory.icon = std::string(obj.at("icon").as_string());
            newCategory.color = std::string(obj.at("color").as_string());
            newCategory.isDefault = obj.contains("isDefault") ? obj.at("isDefault").as_bool() : false;
            
            auto created = CategoryService::getInstance().createUserCategory(newCategory);
            
            if (!created) {
                res.result(http::status::internal_server_error);
                json::object error;
                error["error"] = "Error creating category";
                res.body() = json::serialize(error);
                return;
            }
            
            json::object response;
            response["id"] = created->id;
            response["userId"] = created->userId;
            response["name"] = created->name;
            response["type"] = created->type;
            response["icon"] = created->icon;
            response["color"] = created->color;
            response["isDefault"] = created->isDefault;
            response["isSystem"] = false;
            response["createdAt"] = created->createdAt;
            response["message"] = "Categoría creada exitosamente";
            
            res.result(http::status::created);
            res.body() = json::serialize(response);
            
            emitCategoryEvent("category_created", userInfo.postgresId, created->id, 201,
                            {{"name", created->name}, {"type", created->type}});
        } catch (const std::exception& e) {
            res.result(http::status::bad_request);
            json::object error;
            error["error"] = e.what();
            res.body() = json::serialize(error);
        }
    }
    
    void handle_update_user_category(http::response<http::string_body>& res) {
        keycloak::UserInfo userInfo = verifyAndGetUser(req_);
        if (!userInfo.isValid) {
            res.result(http::status::unauthorized);
            json::object error;
            error["error"] = "Token inválido o expirado";
            res.body() = json::serialize(error);
            return;
        }
        
        std::string target(req_.target().begin(), req_.target().end());
        std::string categoryId = target.substr(22);
        
        try {
            json::value jv = json::parse(req_.body());
            json::object& updates = jv.as_object();
            
            bool success = CategoryService::getInstance().updateUserCategory(
                categoryId, userInfo.postgresId, updates);
            
            if (!success) {
                res.result(http::status::not_found);
                json::object error;
                error["error"] = "Categoría no encontrada";
                res.body() = json::serialize(error);
                return;
            }
            
            json::object response;
            response["message"] = "Categoría actualizada exitosamente";
            response["id"] = categoryId;
            
            res.result(http::status::ok);
            res.body() = json::serialize(response);
            
            emitCategoryEvent("category_updated", userInfo.postgresId, categoryId, 200);
        } catch (const std::exception& e) {
            res.result(http::status::bad_request);
            json::object error;
            error["error"] = e.what();
            res.body() = json::serialize(error);
        }
    }
    
    void handle_delete_user_category(http::response<http::string_body>& res) {
        keycloak::UserInfo userInfo = verifyAndGetUser(req_);
        if (!userInfo.isValid) {
            res.result(http::status::unauthorized);
            json::object error;
            error["error"] = "Token inválido o expirado";
            res.body() = json::serialize(error);
            return;
        }
        
        std::string target(req_.target().begin(), req_.target().end());
        std::string categoryId = target.substr(22);
        
        bool success = CategoryService::getInstance().deleteUserCategory(categoryId, userInfo.postgresId);
        
        if (!success) {
            res.result(http::status::bad_request);
            json::object error;
            error["error"] = "No se puede eliminar la categoría (tiene transacciones asociadas)";
            res.body() = json::serialize(error);
            return;
        }
        
        json::object response;
        response["message"] = "Categoría eliminada exitosamente";
        
        res.result(http::status::ok);
        res.body() = json::serialize(response);
        
        emitCategoryEvent("category_deleted", userInfo.postgresId, categoryId, 200);
    }
    
    void handle_invalidate_cache(http::response<http::string_body>& res) {
        keycloak::UserInfo userInfo = verifyAndGetUser(req_);
        if (!userInfo.isValid) {
            res.result(http::status::unauthorized);
            json::object error;
            error["error"] = "Token inválido o expirado";
            res.body() = json::serialize(error);
            return;
        }
        
        CategoryService::getInstance().invalidateUserCache(userInfo.postgresId);
        
        json::object response;
        response["message"] = "Caché invalidado exitosamente";
        res.result(http::status::ok);
        res.body() = json::serialize(response);
    }
    
    void write_response(http::response<http::string_body>& res) {
        auto self = shared_from_this();
        http::async_write(socket_, res,
            [self](beast::error_code ec, std::size_t) {
                self->socket_.shutdown(tcp::socket::shutdown_send, ec);
            });
    }
};

class HttpServer {
    net::io_context ioc_;
    tcp::acceptor acceptor_;
    
public:
    HttpServer(const std::string& address, unsigned short port) 
        : ioc_(1), acceptor_(ioc_, tcp::endpoint(net::ip::make_address(address), port)) {
        std::cout << "Categories Service listening on " << address << ":" << port << std::endl;
    }
    
    void run() {
        do_accept();
        ioc_.run();
    }
    
private:
    void do_accept() {
        acceptor_.async_accept(
            [this](beast::error_code ec, tcp::socket socket) {
                if (!ec) {
                    std::make_shared<HttpSession>(std::move(socket))->run();
                }
                do_accept();
            });
    }
};

int main() {
    try {
        const char* portEnv = std::getenv("SERVER_PORT");
        unsigned short port = portEnv ? std::stoi(portEnv) : 8082;
        
        const char* keycloakUrl = std::getenv("KEYCLOAK_URL");
        const char* keycloakRealm = std::getenv("KEYCLOAK_REALM");
        
        if (!keycloakUrl) keycloakUrl = "http://keycloak:8080";
        if (!keycloakRealm) keycloakRealm = "yung-accountant";
        
        keycloakClient = std::make_unique<keycloak::KeycloakClient>(keycloakUrl, keycloakRealm);
        
        const char* pgHost = std::getenv("POSTGRES_HOST");
        const char* pgPort = std::getenv("POSTGRES_PORT");
        const char* pgUser = std::getenv("POSTGRES_USER");
        const char* pgPassword = std::getenv("POSTGRES_PASSWORD");
        const char* pgDatabase = std::getenv("POSTGRES_DB");
        
        if (!pgHost) pgHost = "postgresdb";
        if (!pgPort) pgPort = "5432";
        if (!pgUser) pgUser = "admin";
        if (!pgPassword) pgPassword = "secret123";
        if (!pgDatabase) pgDatabase = "yung_accountant";
        
        std::cout << "Connecting to PostgreSQL: " << pgHost << ":" << pgPort << std::endl;
        
        if (!Database::getInstance().connect(pgHost, std::stoi(pgPort), pgDatabase, pgUser, pgPassword)) {
            std::cerr << "Failed to connect to PostgreSQL. Exiting..." << std::endl;
            return 1;
        }
        
        const char* redisHost = std::getenv("REDIS_HOST");
        const char* redisPort = std::getenv("REDIS_PORT");
        const char* redisPassword = std::getenv("REDIS_PASSWORD");
        
        if (!redisHost) redisHost = "redis";
        if (!redisPort) redisPort = "6379";
        
        auto& redis = redis::RedisClient::getInstance();
        if (!redis.connect(redisHost, std::stoi(redisPort), redisPassword ? redisPassword : "")) {
            std::cerr << "Warning: Failed to connect to Redis. Continuing without cache..." << std::endl;
        }
        
        const char* kafkaBroker = std::getenv("KAFKA_BROKER");
        if (!kafkaBroker) kafkaBroker = "kafka:9092";
        kafka::getProducer();
        
        std::cout << "Categories Service starting on 0.0.0.0:" << port << std::endl;
        std::cout << "Redis cache: " << (redis.isConnected() ? "enabled" : "disabled") << std::endl;
        
        HttpServer server("0.0.0.0", port);
        server.run();
        
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}
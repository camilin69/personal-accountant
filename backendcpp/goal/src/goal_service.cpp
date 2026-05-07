#include "goal_service.hpp"
#include "database.hpp"
#include "redis_client.hpp"
#include <pqxx/pqxx>
#include <iostream>
#include <boost/json.hpp>

// ============================================
// SERIALIZACIÓN
// ============================================
std::string GoalService::goalToJson(const Goal& g) {
    boost::json::object obj;
    obj["id"] = g.id;
    obj["userId"] = g.userId;
    obj["name"] = g.name;
    obj["targetAmount"] = g.targetAmount;
    obj["currentAmount"] = g.currentAmount;
    obj["targetDate"] = g.targetDate;
    obj["priority"] = g.priority;
    obj["status"] = g.status;
    obj["context"] = g.context.empty() ? nullptr : boost::json::value(g.context);
    obj["purchaseCategoryId"] = g.purchaseCategoryId.empty() ? nullptr : boost::json::value(g.purchaseCategoryId);
    obj["completedAt"] = g.completedAt.empty() ? nullptr : boost::json::value(g.completedAt);
    obj["createdAt"] = g.createdAt;
    obj["updatedAt"] = g.updatedAt;
    return boost::json::serialize(obj);
}

Goal GoalService::jsonToGoal(const std::string& json) {
    auto jv = boost::json::parse(json);
    auto& obj = jv.as_object();
    Goal g;
    g.id = boost::json::value_to<std::string>(obj.at("id"));
    g.userId = boost::json::value_to<std::string>(obj.at("userId"));
    g.name = boost::json::value_to<std::string>(obj.at("name"));
    g.targetAmount = obj.at("targetAmount").as_double();
    g.currentAmount = obj.at("currentAmount").as_double();
    g.targetDate = boost::json::value_to<std::string>(obj.at("targetDate"));
    g.priority = boost::json::value_to<std::string>(obj.at("priority"));
    g.status = boost::json::value_to<std::string>(obj.at("status"));
    g.context = obj.at("context").is_null() ? "" : boost::json::value_to<std::string>(obj.at("context"));
    g.purchaseCategoryId = obj.at("purchaseCategoryId").is_null() ? "" : boost::json::value_to<std::string>(obj.at("purchaseCategoryId"));
    g.completedAt = obj.at("completedAt").is_null() ? "" : boost::json::value_to<std::string>(obj.at("completedAt"));
    g.createdAt = boost::json::value_to<std::string>(obj.at("createdAt"));
    g.updatedAt = boost::json::value_to<std::string>(obj.at("updatedAt"));
    return g;
}

std::string GoalService::goalsToJson(const std::vector<Goal>& goals) {
    boost::json::array arr;
    for (const auto& g : goals) arr.push_back(boost::json::parse(goalToJson(g)));
    return boost::json::serialize(arr);
}

std::vector<Goal> GoalService::jsonToGoals(const std::string& json) {
    std::vector<Goal> result;
    auto jv = boost::json::parse(json);
    for (const auto& item : jv.as_array()) result.push_back(jsonToGoal(boost::json::serialize(item)));
    return result;
}

std::string GoalService::transactionsToJson(const std::vector<GoalTransaction>& transactions) {
    boost::json::array arr;
    for (const auto& t : transactions) {
        boost::json::object obj;
        obj["id"] = t.id; obj["goalId"] = t.goalId; obj["amount"] = t.amount;
        obj["type"] = t.type; obj["note"] = t.note.empty() ? nullptr : boost::json::value(t.note);
        obj["date"] = t.date; obj["walletId"] = t.walletId; obj["createdAt"] = t.createdAt;
        arr.push_back(obj);
    }
    return boost::json::serialize(arr);
}

std::vector<GoalTransaction> GoalService::jsonToTransactions(const std::string& json) {
    std::vector<GoalTransaction> result;
    auto jv = boost::json::parse(json);
    for (const auto& item : jv.as_array()) {
        auto& obj = item.as_object();
        GoalTransaction t;
        t.id = boost::json::value_to<std::string>(obj.at("id"));
        t.goalId = boost::json::value_to<std::string>(obj.at("goalId"));
        t.amount = obj.at("amount").as_double();
        t.type = boost::json::value_to<std::string>(obj.at("type"));
        t.note = obj.at("note").is_null() ? "" : boost::json::value_to<std::string>(obj.at("note"));
        t.date = boost::json::value_to<std::string>(obj.at("date"));
        t.walletId = boost::json::value_to<std::string>(obj.at("walletId"));
        t.createdAt = boost::json::value_to<std::string>(obj.at("createdAt"));
        result.push_back(t);
    }
    return result;
}

// ============================================
// SINGLETON
// ============================================
GoalService& GoalService::getInstance() {
    static GoalService instance;
    return instance;
}

// ============================================
// CRUD GOALS
// ============================================
std::vector<Goal> GoalService::getGoalsByUser(const std::string& userId) {
    auto& redis = redis::RedisClient::getInstance();
    std::string cacheKey = "goals:user:" + userId;
    
    if (redis.isConnected()) {
        auto cached = redis.get(cacheKey);
        if (cached) {
            std::cout << "[Redis] Cache HIT: goals for " << userId << std::endl;
            return jsonToGoals(*cached);
        }
    }
    
    std::vector<Goal> goals;
    try {
        auto& conn = Database::getInstance().getConnection();
        pqxx::work txn(conn);
        pqxx::result result = txn.exec_params(
            "SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC", userId);
        txn.commit();
        
        for (const auto& row : result) goals.push_back(rowToGoal(row));
        
        if (redis.isConnected()) {
            redis.set(cacheKey, goalsToJson(goals), 300);
        }
    } catch (const std::exception& e) {
        std::cerr << "Error getting goals: " << e.what() << std::endl;
    }
    return goals;
}

std::optional<Goal> GoalService::getGoalById(const std::string& id, const std::string& userId) {
    try {
        auto& conn = Database::getInstance().getConnection();
        pqxx::work txn(conn);
        pqxx::result result = txn.exec_params(
            "SELECT * FROM goals WHERE id = $1 AND user_id = $2", id, userId);
        txn.commit();
        if (!result.empty()) return rowToGoal(result[0]);
        return std::nullopt;
    } catch (const std::exception& e) {
        std::cerr << "Error getting goal: " << e.what() << std::endl;
        return std::nullopt;
    }
}

std::optional<Goal> GoalService::createGoal(const Goal& goal) {
    try {
        auto& conn = Database::getInstance().getConnection();
        pqxx::work txn(conn);
        pqxx::result result = txn.exec_params(
            "INSERT INTO goals (user_id, name, target_amount, current_amount, target_date, "
            "priority, status, context, purchase_category_id) "
            "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, created_at, updated_at",
            goal.userId, goal.name, goal.targetAmount, goal.currentAmount, goal.targetDate,
            goal.priority, goal.status, goal.context, goal.purchaseCategoryId);
        txn.commit();
        
        if (!result.empty()) {
            Goal g = goal;
            g.id = result[0]["id"].as<std::string>();
            g.createdAt = result[0]["created_at"].as<std::string>();
            g.updatedAt = result[0]["updated_at"].as<std::string>();
            invalidateCache(goal.userId);
            return g;
        }
        return std::nullopt;
    } catch (const std::exception& e) {
        std::cerr << "Error creating goal: " << e.what() << std::endl;
        return std::nullopt;
    }
}

bool GoalService::updateGoal(const std::string& id, const std::string& userId, const boost::json::object& updates) {
    try {
        auto& conn = Database::getInstance().getConnection();
        pqxx::work txn(conn);
        
        std::vector<std::string> sets;
        std::vector<std::string> params;
        int n = 1;
        
        auto addStr = [&](const std::string& col, const std::string& val) {
            sets.push_back(col + " = $" + std::to_string(n++));
            params.push_back(val);
        };
        auto addNum = [&](const std::string& col, double val) {
            sets.push_back(col + " = $" + std::to_string(n++));
            params.push_back(std::to_string(val));
        };
        
        if (updates.contains("name")) addStr("name", std::string(updates.at("name").as_string()));
        if (updates.contains("targetAmount")) addNum("target_amount", updates.at("targetAmount").as_double());
        if (updates.contains("currentAmount")) addNum("current_amount", updates.at("currentAmount").as_double());
        if (updates.contains("targetDate")) addStr("target_date", std::string(updates.at("targetDate").as_string()));
        if (updates.contains("priority")) addStr("priority", std::string(updates.at("priority").as_string()));
        if (updates.contains("status")) addStr("status", std::string(updates.at("status").as_string()));
        if (updates.contains("context")) addStr("context", std::string(updates.at("context").as_string()));
        if (updates.contains("completedAt")) addStr("completed_at", std::string(updates.at("completedAt").as_string()));
        if (updates.contains("purchaseCategoryId")) addStr("purchase_category_id", std::string(updates.at("purchaseCategoryId").as_string()));
        
        if (sets.empty()) return false;
        
        std::string query = "UPDATE goals SET ";
        for (size_t i = 0; i < sets.size(); ++i) { if (i > 0) query += ", "; query += sets[i]; }
        query += ", updated_at = CURRENT_TIMESTAMP WHERE id = $" + std::to_string(n++) + " AND user_id = $" + std::to_string(n++);
        params.push_back(id);
        params.push_back(userId);
        
        auto result = txn.exec_params(query, params);
        txn.commit();
        
        if (result.affected_rows() > 0) {
            invalidateCache(userId);
            return true;
        }
        return false;
    } catch (const std::exception& e) {
        std::cerr << "Error updating goal: " << e.what() << std::endl;
        return false;
    }
}

bool GoalService::deleteGoal(const std::string& id, const std::string& userId) {
    try {
        auto& conn = Database::getInstance().getConnection();
        pqxx::work txn(conn);
        auto result = txn.exec_params("DELETE FROM goals WHERE id = $1 AND user_id = $2", id, userId);
        txn.commit();
        if (result.affected_rows() > 0) {
            invalidateCache(userId);
            return true;
        }
        return false;
    } catch (const std::exception& e) {
        std::cerr << "Error deleting goal: " << e.what() << std::endl;
        return false;
    }
}

// ============================================
// GOAL TRANSACTIONS
// ============================================
std::vector<GoalTransaction> GoalService::getGoalTransactions(const std::string& goalId) {
    std::vector<GoalTransaction> transactions;
    try {
        auto& conn = Database::getInstance().getConnection();
        pqxx::work txn(conn);
        auto result = txn.exec_params(
            "SELECT * FROM goal_transactions WHERE goal_id = $1 ORDER BY date DESC", goalId);
        txn.commit();
        for (const auto& row : result) transactions.push_back(rowToTransaction(row));
    } catch (const std::exception& e) {
        std::cerr << "Error getting goal transactions: " << e.what() << std::endl;
    }
    return transactions;
}

std::optional<GoalTransaction> GoalService::addGoalTransaction(const GoalTransaction& transaction) {
    try {
        auto& conn = Database::getInstance().getConnection();
        pqxx::work txn(conn);
        auto result = txn.exec_params(
            "INSERT INTO goal_transactions (goal_id, amount, type, note, date, wallet_id) "
            "VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, created_at",
            transaction.goalId, transaction.amount, transaction.type,
            transaction.note, transaction.date, transaction.walletId);
        txn.commit();
        
        if (!result.empty()) {
            GoalTransaction t = transaction;
            t.id = result[0]["id"].as<std::string>();
            t.createdAt = result[0]["created_at"].as<std::string>();
            return t;
        }
        return std::nullopt;
    } catch (const std::exception& e) {
        std::cerr << "Error adding goal transaction: " << e.what() << std::endl;
        return std::nullopt;
    }
}

bool GoalService::deleteGoalTransaction(const std::string& transactionId) {
    try {
        auto& conn = Database::getInstance().getConnection();
        pqxx::work txn(conn);
        auto result = txn.exec_params("DELETE FROM goal_transactions WHERE id = $1", transactionId);
        txn.commit();
        return result.affected_rows() > 0;
    } catch (const std::exception& e) {
        std::cerr << "Error deleting goal transaction: " << e.what() << std::endl;
        return false;
    }
}

// ============================================
// CACHE
// ============================================
void GoalService::invalidateCache(const std::string& userId) {
    auto& redis = redis::RedisClient::getInstance();
    if (redis.isConnected()) {
        redis.del("goals:user:" + userId);
        std::cout << "[Redis] Invalidated goals cache for: " << userId << std::endl;
    }
}

// ============================================
// ROW MAPPERS
// ============================================
Goal GoalService::rowToGoal(const pqxx::row& row) {
    Goal g;
    g.id = row["id"].as<std::string>();
    g.userId = row["user_id"].as<std::string>();
    g.name = row["name"].as<std::string>();
    g.targetAmount = row["target_amount"].as<double>();
    g.currentAmount = row["current_amount"].as<double>();
    g.targetDate = row["target_date"].as<std::string>();
    g.priority = row["priority"].as<std::string>();
    g.status = row["status"].as<std::string>();
    g.context = row["context"].is_null() ? "" : row["context"].as<std::string>();
    g.purchaseCategoryId = row["purchase_category_id"].is_null() ? "" : row["purchase_category_id"].as<std::string>();
    g.completedAt = row["completed_at"].is_null() ? "" : row["completed_at"].as<std::string>();
    g.createdAt = row["created_at"].as<std::string>();
    g.updatedAt = row["updated_at"].as<std::string>();
    return g;
}

GoalTransaction GoalService::rowToTransaction(const pqxx::row& row) {
    GoalTransaction t;
    t.id = row["id"].as<std::string>();
    t.goalId = row["goal_id"].as<std::string>();
    t.amount = row["amount"].as<double>();
    t.type = row["type"].as<std::string>();
    t.note = row["note"].is_null() ? "" : row["note"].as<std::string>();
    t.date = row["date"].as<std::string>();
    t.walletId = row["wallet_id"].is_null() ? "" : row["wallet_id"].as<std::string>();
    t.createdAt = row["created_at"].as<std::string>();
    return t;
}
#pragma once

#include <string>
#include <vector>
#include <optional>
#include <boost/json.hpp>

struct Category {
    std::string id;
    std::string userId;      // NULL para categorías del sistema
    std::string name;
    std::string type;        // 'income' o 'expense'
    std::string icon;
    std::string color;
    bool isSystem = false;   // true = categoría del sistema (inmutable)
    bool isDefault = false;  // true = categoría por defecto
    std::string createdAt;
};

class CategoryService {
public:
    static CategoryService& getInstance();
    
    // Obtener categorías
    std::vector<Category> getSystemCategories();
    std::vector<Category> getUserCategories(const std::string& userId);
    std::vector<Category> getAllCategories(const std::string& userId);
    std::optional<Category> getCategoryById(const std::string& id, const std::string& userId);
    
    // CRUD de categorías de usuario
    std::optional<Category> createUserCategory(const Category& category);
    bool updateUserCategory(const std::string& id, const std::string& userId, const boost::json::object& updates);
    bool deleteUserCategory(const std::string& id, const std::string& userId);
    
    // Cache
    void invalidateUserCache(const std::string& userId);
    void invalidateSystemCache();
    
private:
    CategoryService() = default;
};
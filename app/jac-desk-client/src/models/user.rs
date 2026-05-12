use serde::{Serialize, Deserialize};
use uuid::{Uuid};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct User {
    pub id: Uuid,
    pub sys_name: String,
}

impl User {
    pub fn new(sys_name: &str) -> Self {
        Self {
            id: Uuid::new_v4(),
            sys_name: sys_name.to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_creation() {
        let user = User::new("test_user");
        assert!(!user.sys_name.is_empty());
        println!("Created user: {}", user.sys_name);
    }

    #[test]
    fn test_uuid_is_unique() {
        let user1 = User::new("user1");
        let user2 = User::new("user2");

        assert_ne!(user1.id, user2.id, "UUIDs должны быть разными!");
    }

    #[test]
    fn test_serialize_to_json() {
        let user = User::new("John");
        let json = serde_json::to_string(&user).unwrap();

        assert!(json.contains("John"));
        println!("JSON: {}", json);
    }

    #[test]
    fn test_deserialize_from_json() {
        let json = r#"{"id":"550e8400-e29b-41d4-a716-446655440000","sys_name":"Alice"}"#;
        let user: User = serde_json::from_str(json).unwrap();

        assert_eq!(user.sys_name, "Alice");
    }
}
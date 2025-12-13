// use std::fs;
// use std::path::Path;
//
// use std::error::Error;
//
// #[derive(Debug, serde::Deserialize, serde::Serialize, Clone)]
// pub struct User {
//     pub id: u32,
//     pub username: String,
//     pub password: String,
//     pub permission: Vec<String>,
// }
//
// impl User {
//     fn get_users() -> Result<Vec<User>, &str> {
//         let path = Path::new("users.json");
//
//         if !path.exists() {
//             fs::write(path, "[]")?;
//             return Ok(Vec::new()); // 这里涵盖没有就创建
//         }
//         let data = fs::read_to_string(path)?;
//
//         let users: Vec<User> = serde_json::from_str(&data)?;
//
//         Ok(users)
//     }
//     fn remove(id: u32) -> Result<(), &str>{
//         let mut users = User::get_users()?;
//         let initial_len = users.len();
//         users.retain(|u| u.id != id);
//         if users.len() < initial_len {Ok(())}
//         Err("Unknown user.")
//
//     }
//     fn new(username: String, password: String, permission: Permission) -> Result<(), &str> {
//         let mut users = User::get_users()?;
//         if users.iter().any(|u| u.username == username) {
//             return Err("Duplicate username.");
//         } // 查重
//
//         let new_user = User {
//             id: users.len() as u32 + 1,
//             username,
//             password,
//             permission,
//         };
//
//         users.push(new_user);
//         let serialized_data = serde_json::to_string_pretty(&users)?;
//         fs::write("users.json", serialized_data)?;
//
//         Ok(())
//     }
// }
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS closet_items;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  gender TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  height REAL,
  weight REAL,
  body_type TEXT,
  personal_color TEXT,
  preferred_style TEXT,
  preferred_fit TEXT,
  style_priority TEXT
);

CREATE TABLE closet_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  category_large TEXT NOT NULL,
  category_small TEXT NOT NULL,
  color TEXT,
  image_path TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

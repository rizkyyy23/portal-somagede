USE somagede_db;

DROP TRIGGER IF EXISTS before_user_privileges_insert;

DELIMITER $$

CREATE TRIGGER before_user_privileges_insert 
BEFORE INSERT ON user_privileges
FOR EACH ROW 
BEGIN
  DECLARE v_name VARCHAR(190);
  DECLARE v_email VARCHAR(190);
  
  SELECT name, email INTO v_name, v_email 
  FROM users 
  WHERE id = NEW.user_id;
  
  SET NEW.user_name = v_name;
  SET NEW.user_email = v_email;
END$$

DELIMITER ;

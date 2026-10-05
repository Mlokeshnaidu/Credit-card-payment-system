-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: credit_card_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_logs`
--

DROP TABLE IF EXISTS `admin_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(50) NOT NULL,
  `description` longtext NOT NULL,
  `ip_address` char(39) DEFAULT NULL,
  `timestamp` datetime(6) NOT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `admin_logs_user_id_7cc6dd52_fk_users_id` (`user_id`),
  CONSTRAINT `admin_logs_user_id_7cc6dd52_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_logs`
--

LOCK TABLES `admin_logs` WRITE;
/*!40000 ALTER TABLE `admin_logs` DISABLE KEYS */;
INSERT INTO `admin_logs` VALUES (1,'LOGIN','User logged in: admin@ccpay.com','172.19.0.1','2026-10-03 07:25:24.878888',1),(2,'LOGIN','User logged in: admin@ccpay.com','172.19.0.1','2026-10-03 07:35:01.408300',1),(3,'LOGIN','User logged in: admin@ccpay.com','172.19.0.1','2026-10-03 07:37:46.114289',1),(4,'LOGIN','User logged in: admin@ccpay.com','172.19.0.1','2026-10-03 07:39:52.503600',1),(5,'LOGOUT','User logged out: admin@ccpay.com','172.19.0.1','2026-10-03 07:39:54.265489',1),(6,'REGISTER','New user registered: mandalalokesh2001@gmail.com','172.19.0.1','2026-10-03 07:56:37.735477',2),(7,'CARD_ADD','Card added: ****-****-****-1111','172.19.0.1','2026-10-03 07:58:32.887018',2),(8,'PAYMENT','Payment TXN-64495F0BE5C0: 4552.00 INR - FAILED','172.19.0.1','2026-10-03 07:59:13.209754',2),(9,'PAYMENT','Payment TXN-9611DD23AB20: 1000.00 INR - FAILED','172.19.0.1','2026-10-03 07:59:50.518817',2),(10,'LOGOUT','User logged out: mandalalokesh2001@gmail.com','172.19.0.1','2026-10-03 08:05:52.016207',2),(11,'LOGIN','User logged in: admin@ccpay.com','172.19.0.1','2026-10-03 08:05:57.021145',1),(12,'REGISTER','New user registered: demo@example.com','172.19.0.1','2026-10-04 20:30:00.539700',3),(13,'LOGIN','User logged in: demo@example.com','172.19.0.1','2026-10-04 20:30:01.099541',3),(14,'CARD_ADD','Card added: ****-****-****-1111','172.19.0.1','2026-10-04 20:30:01.222310',3),(15,'PAYMENT','Payment TXN-E8D2AAA3CB85: 250.00 INR - SUCCESS','172.19.0.1','2026-10-04 20:30:02.171793',3),(16,'PAYMENT','Payment TXN-69EBA84559A5: 500.00 INR - FAILED','172.19.0.1','2026-10-04 20:30:02.783472',3),(17,'PAYMENT','Payment TXN-B2DF2B160DA2: 1000.00 INR - SUCCESS','172.19.0.1','2026-10-04 20:30:03.373500',3),(18,'PAYMENT','Payment TXN-D8E02BE097E0: 2500.00 INR - SUCCESS','172.19.0.1','2026-10-04 20:30:03.964907',3),(19,'PAYMENT','Payment TXN-28A628DB5A18: 5000.00 INR - FAILED','172.19.0.1','2026-10-04 20:30:04.546142',3),(20,'PAYMENT','Payment TXN-8F06DC799C55: 20000.00 INR - SUCCESS','172.19.0.1','2026-10-04 20:30:05.138320',3),(21,'PAYMENT','Payment TXN-94CE1988D4BE: 60000.00 INR - FAILED','172.19.0.1','2026-10-04 20:30:05.725147',3),(22,'PAYMENT','Payment TXN-F45AE1D08128: 120000.00 INR - FAILED','172.19.0.1','2026-10-04 20:30:06.349236',3),(23,'LOGIN','User logged in: admin@ccpay.com','172.19.0.1','2026-10-04 20:31:18.077077',1),(24,'EXPORT','Admin exported 8 transactions to CSV',NULL,'2026-10-04 20:31:18.272565',1),(25,'LOGIN','User logged in: demo@example.com','172.19.0.1','2026-10-05 06:40:24.418669',3),(26,'LOGIN','User logged in: demo@example.com','172.19.0.1','2026-10-05 11:31:56.439575',3);
/*!40000 ALTER TABLE `admin_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add content type',4,'add_contenttype'),(14,'Can change content type',4,'change_contenttype'),(15,'Can delete content type',4,'delete_contenttype'),(16,'Can view content type',4,'view_contenttype'),(17,'Can add session',5,'add_session'),(18,'Can change session',5,'change_session'),(19,'Can delete session',5,'delete_session'),(20,'Can view session',5,'view_session'),(21,'Can add Blacklisted Token',6,'add_blacklistedtoken'),(22,'Can change Blacklisted Token',6,'change_blacklistedtoken'),(23,'Can delete Blacklisted Token',6,'delete_blacklistedtoken'),(24,'Can view Blacklisted Token',6,'view_blacklistedtoken'),(25,'Can add Outstanding Token',7,'add_outstandingtoken'),(26,'Can change Outstanding Token',7,'change_outstandingtoken'),(27,'Can delete Outstanding Token',7,'delete_outstandingtoken'),(28,'Can view Outstanding Token',7,'view_outstandingtoken'),(29,'Can add User',8,'add_user'),(30,'Can change User',8,'change_user'),(31,'Can delete User',8,'delete_user'),(32,'Can view User',8,'view_user'),(33,'Can add Admin Log',9,'add_adminlog'),(34,'Can change Admin Log',9,'change_adminlog'),(35,'Can delete Admin Log',9,'delete_adminlog'),(36,'Can view Admin Log',9,'view_adminlog'),(37,'Can add Card',10,'add_card'),(38,'Can change Card',10,'change_card'),(39,'Can delete Card',10,'delete_card'),(40,'Can view Card',10,'view_card'),(41,'Can add Transaction',11,'add_transaction'),(42,'Can change Transaction',11,'change_transaction'),(43,'Can delete Transaction',11,'delete_transaction'),(44,'Can view Transaction',11,'view_transaction');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cards`
--

DROP TABLE IF EXISTS `cards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cards` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `card_holder_name` varchar(255) NOT NULL,
  `last_four_digits` varchar(4) NOT NULL,
  `masked_card_number` varchar(20) NOT NULL,
  `card_type` varchar(10) NOT NULL,
  `expiry_month` int NOT NULL,
  `expiry_year` int NOT NULL,
  `bank_name` varchar(100) NOT NULL,
  `is_default` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cards_user_id_8fb8d426_fk_users_id` (`user_id`),
  CONSTRAINT `cards_user_id_8fb8d426_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cards`
--

LOCK TABLES `cards` WRITE;
/*!40000 ALTER TABLE `cards` DISABLE KEYS */;
INSERT INTO `cards` VALUES (1,'M Loki','1111','****-****-****-1111','CREDIT',9,2038,'hdfc',0,'2026-10-03 07:58:32.876267','2026-10-03 07:58:32.876377',2),(2,'Demo User','1111','****-****-****-1111','CREDIT',12,2032,'HDFC',0,'2026-10-04 20:30:01.179353','2026-10-04 20:30:01.179377',3);
/*!40000 ALTER TABLE `cards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_users_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (9,'accounts','adminlog'),(8,'accounts','user'),(1,'admin','logentry'),(3,'auth','group'),(2,'auth','permission'),(10,'cards','card'),(4,'contenttypes','contenttype'),(5,'sessions','session'),(6,'token_blacklist','blacklistedtoken'),(7,'token_blacklist','outstandingtoken'),(11,'transactions','transaction');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-10-03 07:13:30.080108'),(2,'contenttypes','0002_remove_content_type_name','2026-10-03 07:13:30.485327'),(3,'auth','0001_initial','2026-10-03 07:13:32.579862'),(4,'auth','0002_alter_permission_name_max_length','2026-10-03 07:13:33.271942'),(5,'auth','0003_alter_user_email_max_length','2026-10-03 07:13:33.311203'),(6,'auth','0004_alter_user_username_opts','2026-10-03 07:13:33.348503'),(7,'auth','0005_alter_user_last_login_null','2026-10-03 07:13:33.391991'),(8,'auth','0006_require_contenttypes_0002','2026-10-03 07:13:33.428003'),(9,'auth','0007_alter_validators_add_error_messages','2026-10-03 07:13:33.469020'),(10,'auth','0008_alter_user_username_max_length','2026-10-03 07:13:33.502276'),(11,'auth','0009_alter_user_last_name_max_length','2026-10-03 07:13:33.536024'),(12,'auth','0010_alter_group_name_max_length','2026-10-03 07:13:33.620948'),(13,'auth','0011_update_proxy_permissions','2026-10-03 07:13:33.663232'),(14,'auth','0012_alter_user_first_name_max_length','2026-10-03 07:13:33.687483'),(15,'accounts','0001_initial','2026-10-03 07:13:37.888999'),(16,'admin','0001_initial','2026-10-03 07:13:39.374026'),(17,'admin','0002_logentry_remove_auto_add','2026-10-03 07:13:39.413770'),(18,'admin','0003_logentry_add_action_flag_choices','2026-10-03 07:13:39.478527'),(19,'cards','0001_initial','2026-10-03 07:13:40.268744'),(20,'sessions','0001_initial','2026-10-03 07:13:40.634718'),(21,'token_blacklist','0001_initial','2026-10-03 07:13:42.346939'),(22,'token_blacklist','0002_outstandingtoken_jti_hex','2026-10-03 07:13:42.892973'),(23,'token_blacklist','0003_auto_20171017_2007','2026-10-03 07:13:42.982662'),(24,'token_blacklist','0004_auto_20171017_2013','2026-10-03 07:13:43.822817'),(25,'token_blacklist','0005_remove_outstandingtoken_jti','2026-10-03 07:13:44.285260'),(26,'token_blacklist','0006_auto_20171017_2113','2026-10-03 07:13:44.548329'),(27,'token_blacklist','0007_auto_20171017_2214','2026-10-03 07:13:46.255563'),(28,'token_blacklist','0008_migrate_to_bigautofield','2026-10-03 07:13:48.970083'),(29,'token_blacklist','0010_fix_migrate_to_bigautofield','2026-10-03 07:13:49.046025'),(30,'token_blacklist','0011_linearizes_history','2026-10-03 07:13:49.059285'),(31,'token_blacklist','0012_alter_outstandingtoken_user','2026-10-03 07:13:49.149229'),(32,'token_blacklist','0013_alter_blacklistedtoken_options_and_more','2026-10-03 07:13:49.228497'),(33,'transactions','0001_initial','2026-10-03 07:13:50.815983');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_logs`
--

DROP TABLE IF EXISTS `payment_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_id` varchar(100) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `amount` varchar(20) DEFAULT NULL,
  `currency` varchar(3) DEFAULT NULL,
  `card_last_four` varchar(4) DEFAULT NULL,
  `card_type` varchar(10) DEFAULT NULL,
  `status` varchar(10) DEFAULT NULL,
  `failure_reason` varchar(255) DEFAULT NULL,
  `processing_time_ms` int DEFAULT NULL,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_payment_logs_transaction_id` (`transaction_id`),
  KEY `ix_payment_logs_id` (`id`),
  KEY `ix_payment_logs_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_logs`
--

LOCK TABLES `payment_logs` WRITE;
/*!40000 ALTER TABLE `payment_logs` DISABLE KEYS */;
INSERT INTO `payment_logs` VALUES (1,'TXN-E8D2AAA3CB85',3,'250.0','INR','1111','CREDIT','SUCCESS','',500,'2026-10-04 20:30:02'),(2,'TXN-69EBA84559A5',3,'500.0','INR','1111','CREDIT','FAILED','Card declined by issuer',500,'2026-10-04 20:30:02'),(3,'TXN-B2DF2B160DA2',3,'1000.0','INR','1111','CREDIT','SUCCESS','',500,'2026-10-04 20:30:03'),(4,'TXN-D8E02BE097E0',3,'2500.0','INR','1111','CREDIT','SUCCESS','',500,'2026-10-04 20:30:03'),(5,'TXN-28A628DB5A18',3,'5000.0','INR','1111','CREDIT','FAILED','Insufficient funds',500,'2026-10-04 20:30:04'),(6,'TXN-8F06DC799C55',3,'20000.0','INR','1111','CREDIT','SUCCESS','',500,'2026-10-04 20:30:05'),(7,'TXN-94CE1988D4BE',3,'60000.0','INR','1111','CREDIT','FAILED','Insufficient funds',500,'2026-10-04 20:30:05'),(8,'TXN-F45AE1D08128',3,'120000.0','INR','1111','CREDIT','FAILED','Card declined by issuer',500,'2026-10-04 20:30:06');
/*!40000 ALTER TABLE `payment_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `token_blacklist_blacklistedtoken`
--

DROP TABLE IF EXISTS `token_blacklist_blacklistedtoken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_blacklist_blacklistedtoken` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `blacklisted_at` datetime(6) NOT NULL,
  `token_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_id` (`token_id`),
  CONSTRAINT `token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk` FOREIGN KEY (`token_id`) REFERENCES `token_blacklist_outstandingtoken` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_blacklist_blacklistedtoken`
--

LOCK TABLES `token_blacklist_blacklistedtoken` WRITE;
/*!40000 ALTER TABLE `token_blacklist_blacklistedtoken` DISABLE KEYS */;
INSERT INTO `token_blacklist_blacklistedtoken` VALUES (1,'2026-10-03 07:39:54.256775',4),(2,'2026-10-03 08:05:52.008026',5);
/*!40000 ALTER TABLE `token_blacklist_blacklistedtoken` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `token_blacklist_outstandingtoken`
--

DROP TABLE IF EXISTS `token_blacklist_outstandingtoken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_blacklist_outstandingtoken` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `token` longtext NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `expires_at` datetime(6) NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `jti` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_uniq` (`jti`),
  KEY `token_blacklist_outstandingtoken_user_id_83bc629a_fk_users_id` (`user_id`),
  CONSTRAINT `token_blacklist_outstandingtoken_user_id_83bc629a_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_blacklist_outstandingtoken`
--

LOCK TABLES `token_blacklist_outstandingtoken` WRITE;
/*!40000 ALTER TABLE `token_blacklist_outstandingtoken` DISABLE KEYS */;
INSERT INTO `token_blacklist_outstandingtoken` VALUES (1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MTYxNzEyNCwiaWF0IjoxNzkxMDEyMzI0LCJqdGkiOiJlMzJmMWQ0YjY4M2Q0NTI4ODgyM2QxMTZkNThkZGEzYyIsInVzZXJfaWQiOiIxIn0.1BiIfSPp8WViKyM22X9VraMRfEa2CtOO3ubkkDhb7SU','2026-10-03 07:25:24.864291','2026-10-10 07:25:24.000000',1,'e32f1d4b683d45288823d116d58dda3c'),(2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MTYxNzcwMSwiaWF0IjoxNzkxMDEyOTAxLCJqdGkiOiJmZjUxNmZkZDliY2I0Y2M1YWY0ZTA3ODA3NWFiMjU3OSIsInVzZXJfaWQiOiIxIn0.VEAKLHta1Lc10tdp313bdk2wAHEPpNuX9RItDFDhXLQ','2026-10-03 07:35:01.396434','2026-10-10 07:35:01.000000',1,'ff516fdd9bcb4cc5af4e078075ab2579'),(3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MTYxNzg2NiwiaWF0IjoxNzkxMDEzMDY2LCJqdGkiOiI0YTc4OGM0MTYwNWE0ZDczOGE3M2IwOGIyNWY5ZGFhYiIsInVzZXJfaWQiOiIxIn0.AdxOrabiniN9G2qEBbLzhQanhU13nk0Gvt2V8TDCAzM','2026-10-03 07:37:46.105727','2026-10-10 07:37:46.000000',1,'4a788c41605a4d738a73b08b25f9daab'),(4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MTYxNzk5MiwiaWF0IjoxNzkxMDEzMTkyLCJqdGkiOiJjOGE4MWI0NzI4ZTE0MTUzYmRkNWU3NGIzMDkwZDBhMCIsInVzZXJfaWQiOiIxIn0.ls9i9YftWF6btaV1jakX6O_UCXWyTKfjrdnF_AxOMgg','2026-10-03 07:39:52.495058','2026-10-10 07:39:52.000000',1,'c8a81b4728e14153bdd5e74b3090d0a0'),(5,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MTYxODk5NywiaWF0IjoxNzkxMDE0MTk3LCJqdGkiOiIxY2M0ZTE0MDQ2MWI0MjQwOThkOTU5YzdmOTZiNjBlOCIsInVzZXJfaWQiOiIyIn0.nyZ8Jz4btWqdD3GsWRaTB4bEZooxo664pdmBN3mtO2E','2026-10-03 07:56:37.673119','2026-10-10 07:56:37.000000',2,'1cc4e140461b424098d959c7f96b60e8'),(6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MTYxOTU1NywiaWF0IjoxNzkxMDE0NzU3LCJqdGkiOiJmZjA0MjhjNjI2Njk0OTlmODYyNmE2NjM0YjkxOTY0ZCIsInVzZXJfaWQiOiIxIn0.GuBG4VUDhtI1AS1kyNzeuxTYfRC4JEoTQhaisULS1zU','2026-10-03 08:05:57.013355','2026-10-10 08:05:57.000000',1,'ff0428c62669499f8626a6634b91964d'),(7,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MTc1MDYwMCwiaWF0IjoxNzkxMTQ1ODAwLCJqdGkiOiI0ZTY2NzJkNmZmMzI0MTM5YmY4NzE1MjUzNWUyODU4OSIsInVzZXJfaWQiOiIzIn0.18VFmoGGk1UFh9RQ-gy5HXI2Xh0qFL_exXfETbE1rWA','2026-10-04 20:30:00.524245','2026-10-11 20:30:00.000000',3,'4e6672d6ff324139bf87152535e28589'),(8,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MTc1MDYwMSwiaWF0IjoxNzkxMTQ1ODAxLCJqdGkiOiIwYzQ2OTE3MTJmYTM0ZjE5YjMxYmEyMGRlMjA3MWE2OCIsInVzZXJfaWQiOiIzIn0.FKW3WCbx7IqEEohlhdydwjOzsyOcFnXMQCJlep7RfBU','2026-10-04 20:30:01.091963','2026-10-11 20:30:01.000000',3,'0c4691712fa34f19b31ba20de2071a68'),(9,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MTc1MDY3OCwiaWF0IjoxNzkxMTQ1ODc4LCJqdGkiOiJkOGNlMjczMGY4YTU0ZWJlYTJhYTA4YjM0NGMyMzM5ZiIsInVzZXJfaWQiOiIxIn0.2CT3P6PLvDytjKX-jK-0ROOCCjgID1tvSfuOijWdX10','2026-10-04 20:31:18.068696','2026-10-11 20:31:18.000000',1,'d8ce2730f8a54ebea2aa08b344c2339f'),(10,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MTc4NzIyNCwiaWF0IjoxNzkxMTgyNDI0LCJqdGkiOiJiZTAzMzM1ODUxZTU0YTRlOThhM2ViZGJkNDg2MTA4YyIsInVzZXJfaWQiOiIzIn0.4HQmSSxJGlGm1ySLCQ9moKxPgq8vpx2GAG2ntc5ZN7s','2026-10-05 06:40:24.383033','2026-10-12 06:40:24.000000',3,'be03335851e54a4e98a3ebdbd486108c'),(11,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MTgwNDcxNiwiaWF0IjoxNzkxMTk5OTE2LCJqdGkiOiI4YmZhZDhiNzE4OGQ0YTJmYTJmODQ0OGM0YWE4NGYzYSIsInVzZXJfaWQiOiIzIn0.T5qv9jv1KQY8IeMl_ll42E6oVwEun32lmx362QU6Ftk','2026-10-05 11:31:56.423439','2026-10-12 11:31:56.000000',3,'8bfad8b7188d4a2fa2f8448c4aa84f3a');
/*!40000 ALTER TABLE `token_blacklist_outstandingtoken` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(3) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `merchant_name` varchar(255) DEFAULT NULL,
  `status` varchar(10) NOT NULL,
  `transaction_id` varchar(100) NOT NULL,
  `failure_reason` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `card_id` bigint DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `transactions_card_id_f8e89ea3_fk_cards_id` (`card_id`),
  KEY `transactions_user_id_766cc893_fk_users_id` (`user_id`),
  CONSTRAINT `transactions_card_id_f8e89ea3_fk_cards_id` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`),
  CONSTRAINT `transactions_user_id_766cc893_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (3,250.00,'INR','Test payment','Demo Store','SUCCESS','TXN-E8D2AAA3CB85','','2026-10-04 20:30:01.295793','2026-10-04 20:30:02.164077',2,3),(4,500.00,'INR','Test payment','Demo Store','FAILED','TXN-69EBA84559A5','Card declined by issuer','2026-10-04 20:30:02.254041','2026-10-04 20:30:02.777196',2,3),(5,1000.00,'INR','Test payment','Demo Store','SUCCESS','TXN-B2DF2B160DA2','','2026-10-04 20:30:02.845188','2026-10-04 20:30:03.364239',2,3),(6,2500.00,'INR','Test payment','Demo Store','SUCCESS','TXN-D8E02BE097E0','','2026-10-04 20:30:03.440106','2026-10-04 20:30:03.956690',2,3),(7,5000.00,'INR','Test payment','Demo Store','FAILED','TXN-28A628DB5A18','Insufficient funds','2026-10-04 20:30:04.024486','2026-10-04 20:30:04.540930',2,3),(8,20000.00,'INR','Test payment','Demo Store','SUCCESS','TXN-8F06DC799C55','','2026-10-04 20:30:04.610528','2026-10-04 20:30:05.131013',2,3),(9,60000.00,'INR','Test payment','Demo Store','FAILED','TXN-94CE1988D4BE','Insufficient funds','2026-10-04 20:30:05.199740','2026-10-04 20:30:05.715461',2,3),(10,120000.00,'INR','Test payment','Demo Store','FAILED','TXN-F45AE1D08128','Card declined by issuer','2026-10-04 20:30:05.784505','2026-10-04 20:30:06.341789',2,3);
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `email` varchar(254) NOT NULL,
  `username` varchar(150) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_admin` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'pbkdf2_sha256$1000000$jk6B48mLrfSxjK47xdcq6C$06ZOqG5hJzby7E22b8QO734Bv06Ni5qA/6zaM0rVBbE=',1,'admin@ccpay.com','admin','System Admin',NULL,1,1,1,'2026-10-03 07:14:06.139028','2026-10-04 20:31:18.060268'),(2,'pbkdf2_sha256$1000000$DRwIm2NsdNcSH7CuJgH5XY$EFuILIhYm1zNWzwVeuOYAiPn15goamaNDmfIuaplMXg=',0,'mandalalokesh2001@gmail.com','Mandala','M LOKESH','+919345491405',1,0,0,'2026-10-03 07:56:37.202548',NULL),(3,'pbkdf2_sha256$1000000$OjqMBwsSpY3ESmOmz8Wzmo$lzzg7J6SLzUt4XE96TWKPvB6XKpz7LYcDhDxLiVAKE8=',0,'demo@example.com','demo','Demo User','+919876543210',1,0,0,'2026-10-04 20:30:00.059519','2026-10-05 11:31:56.416124');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_groups`
--

DROP TABLE IF EXISTS `users_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_groups_user_id_group_id_fc7788e8_uniq` (`user_id`,`group_id`),
  KEY `users_groups_group_id_2f3517aa_fk_auth_group_id` (`group_id`),
  CONSTRAINT `users_groups_group_id_2f3517aa_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `users_groups_user_id_f500bee5_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_groups`
--

LOCK TABLES `users_groups` WRITE;
/*!40000 ALTER TABLE `users_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `users_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_user_permissions`
--

DROP TABLE IF EXISTS `users_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_user_permissions_user_id_permission_id_3b86cbdf_uniq` (`user_id`,`permission_id`),
  KEY `users_user_permissio_permission_id_6d08dcd2_fk_auth_perm` (`permission_id`),
  CONSTRAINT `users_user_permissio_permission_id_6d08dcd2_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `users_user_permissions_user_id_92473840_fk_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_user_permissions`
--

LOCK TABLES `users_user_permissions` WRITE;
/*!40000 ALTER TABLE `users_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `users_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-05 11:46:33

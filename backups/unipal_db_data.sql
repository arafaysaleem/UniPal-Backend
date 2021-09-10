-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 10, 2021 at 01:13 PM
-- Server version: 10.4.20-MariaDB
-- PHP Version: 8.0.9

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `unipal_db`
--

--
-- Dumping data for table `activity_statuses`
--

INSERT INTO `activity_statuses` (`activity_status_id`, `activity_status`) VALUES
(1, 'Happening'),
(2, 'Scheduled'),
(3, 'Cancelled'),
(4, 'Completed');

--
-- Dumping data for table `campuses`
--

INSERT INTO `campuses` (`campus_id`, `campus`, `location_url`) VALUES
(1, 'MAIN', 'https://maps.app.goo.gl/LvH61VeZZVfyggHw6'),
(2, 'CITY', 'https://maps.app.goo.gl/LvH61VeZZVfyggHw6');

--
-- Dumping data for table `hobbies`
--

INSERT INTO `hobbies` (`hobby_id`, `hobby`) VALUES
(1, 'painting'),
(2, 'singing'),
(3, 'reading'),
(4, 'coding');

--
-- Dumping data for table `interests`
--

INSERT INTO `interests` (`interest_id`, `interest`) VALUES
(1, 'sports'),
(2, 'art'),
(3, 'history'),
(4, 'technology');

--
-- Dumping data for table `programs`
--

INSERT INTO `programs` (`program_id`, `program`) VALUES
(1, 'BSCS'),
(2, 'BSACF');

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`erp`, `first_name`, `last_name`, `gender`, `contact`, `email`, `birthday`, `password`, `profile_picture_url`, `graduation_year`, `uni_email`, `hobby_1`, `hobby_2`, `hobby_3`, `interest_1`, `interest_2`, `interest_3`, `program_id`, `campus_id`, `favourite_campus_hangout_spot`, `favourite_campus_activity`, `current_status`, `is_active`, `role`) VALUES
('15030', 'Mohammad Rafay', 'Siddiqui', 'male', '+923009999999', 'rafaysiddiqui58@gmail.com', '1999-09-18', '$2a$08$rN26l6b2CRlSxp0jvCf/4u4WXJ85upOty4t73LR2b419wu/5.22ga', 'https://i.pinimg.com/564x/8d/e3/89/8de389c84e919d3577f47118e2627d95.jpg', 2022, 'm.rafay.15030@iba.khi.edu.pk', 1, 2, 3, 1, 2, 3, 1, 1, 'CED', 'Lifting', 1, 1, 'admin'),
('17855', 'Abdur Rafay', 'Saleem', 'male', '+923009999999', 'arafaysaleem@gmail.com', '1999-09-18', '$2a$08$GOxUY8wR5qIE.fA.q9DdVuyLrdQYLHUFcmt1ibwNeXmIsJvgefwWu', 'https://i.pinimg.com/564x/8d/e3/89/8de389c84e919d3577f47118e2627d95.jpg', 2022, 'a.rafay.17855@iba.khi.edu.pk', 1, 2, 3, 1, 2, 3, 1, 1, 'CED', 'Lifting', 1, 1, 'api_user');

--
-- Dumping data for table `student_statuses`
--

INSERT INTO `student_statuses` (`student_status_id`, `student_status`) VALUES
(1, 'Looking for a friend'),
(2, 'Looking for transport');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

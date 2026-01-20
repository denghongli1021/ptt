CREATE TABLE `boards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`displayName` varchar(128) NOT NULL,
	`category` varchar(32) NOT NULL,
	`description` text,
	`popularity` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boards_id` PRIMARY KEY(`id`),
	CONSTRAINT `boards_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `commentReactions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`commentId` bigint NOT NULL,
	`userId` int NOT NULL,
	`reaction` enum('like','dislike') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commentReactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`postId` bigint NOT NULL,
	`content` text NOT NULL,
	`type` enum('push','booh','neutral') NOT NULL,
	`authorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`boardId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`authorId` int NOT NULL,
	`commentCount` int NOT NULL DEFAULT 0,
	`pushCount` int NOT NULL DEFAULT 0,
	`boohCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);

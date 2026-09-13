terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default     = "ap-south-1"
  description = "AWS region for deployment"
}

variable "environment" {
  default     = "production"
  description = "Deployment environment"
}

variable "db_password" {
  description = "PostgreSQL RDS master password injected via secrets manager or environment variable"
  type        = string
  sensitive   = true
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "amrutam-vpc-${var.environment}"
    Environment = var.environment
  }
}

# Subnets
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = { Name = "amrutam-public-subnet-1" }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = { Name = "amrutam-public-subnet-2" }
}

# PostgreSQL RDS Instance
resource "aws_db_subnet_group" "rds" {
  name       = "amrutam-rds-subnet-group"
  subnet_ids = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

resource "aws_db_instance" "postgres" {
  identifier             = "amrutam-postgres-db"
  allocated_storage      = 20
  max_allocated_storage  = 100
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t4g.micro"
  db_name                = "amrutam_db"
  username               = "amrutam_admin"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.rds.name
  skip_final_snapshot    = true
  multi_az               = false

  tags = {
    Environment = var.environment
  }
}

# Elasticache Redis Cluster
resource "aws_elasticache_subnet_group" "redis" {
  name       = "amrutam-redis-subnet-group"
  subnet_ids = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "amrutam-redis-cluster"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].address
}

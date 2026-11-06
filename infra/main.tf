provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "public" {
  bucket = "pfe-public-bucket"
  acl    = "public-read"
}

resource "aws_security_group" "open" {
  name = "open-sg"

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

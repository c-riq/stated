terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.20.1"
    }
  }
  required_version = ">= 1.5.7"
}

provider "aws" {
  region  = "eu-west-2"
  profile = "rixdata-s3"
}

resource "aws_s3_bucket" "this" {
  bucket = "static.stated.example.com"
}

resource "aws_s3_bucket_website_configuration" "this" {
  bucket = aws_s3_bucket.this.bucket
  index_document {
    suffix = "index.html"
  }
  error_document {
    key = "index.html"
  }
}


resource "aws_s3_bucket_public_access_block" "example" {
  bucket = aws_s3_bucket.this.bucket

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}


resource "aws_s3_bucket_policy" "this" {
  bucket = aws_s3_bucket.this.id

  policy = data.aws_iam_policy_document.public_access.json

}

data "aws_iam_policy_document" "public_access" {
  statement {
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = [
      "s3:GetObject",
    ]
    resources = [
      aws_s3_bucket.this.arn,
      "${aws_s3_bucket.this.arn}/**",
    ]

    effect = "Allow"

  }
}

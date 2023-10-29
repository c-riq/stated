set x
trap "exit" INT

aws_profile=rixdata-s3
s3_bucket=static.stated.rixdata.net
cloudfront_id=E36SIAKIKWG8E8

echo Profile: $aws_profile
echo S3_Bucket: $s3_bucket
echo CloudFront Distribution: $cloudfront_id

if [ -z "$aws_profile" ]; then
  echo AWS_PROFILE not found
  exit
fi
if [ -z "$s3_bucket" ]; then
  echo S3_BUCKET not found
  exit
fi

export AWS_PROFILE=$aws_profile

if [ ! -d "../public" ]; then
    echo "${red}public folder not found${reset}"
    exit 0;
fi

echo Synching Build Folder: $s3_bucket...
aws s3 sync ../public/ s3://$s3_bucket --delete --cache-control max-age=31536000,build


if [ ! -z "$cloudfront_id" ]; then
    echo Invalidating cloudfront cache
    aws cloudfront create-invalidation --distribution-id $cloudfront_id --paths "/*"
fi

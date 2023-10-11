### Deploying static statements on AWS
Not ready; currently being developed.

### Steps
- replace all occurences of 'eu-west-2' with your desired region
- replace all occurences of 'static.stated.example.com' with your subdomain
- replace all occurences of 'rixdata-s3' with your aws profile, which you have configured to access aws s3 and cloudfront with access keys via the aws cli locally
- install terraform and run 'terraform init' and 'terraform apply'
- update your statements in '../public'
- run './publish-statements.sh' to upload your statements to the created aws s3 bucket
- adapt your aws cloudfront config if needed
- generate a https certificate in aws cloud
- create the necessary DNS entries in yout domain registrar settings to link the cloudfront distribution to 'static.stated.' subdomain of your organisations domain

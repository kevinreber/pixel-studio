#!/bin/bash

# AWS MSK Deployment Script for Pixel Studio
# Based on TECHNICAL_IMPLEMENTATION_GUIDE.md

set -e

# Configuration
STACK_NAME="pixel-studio-kafka"
TEMPLATE_FILE="msk-cluster.yml"
REGION="${AWS_REGION:-us-east-1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy    Deploy or update the MSK cluster"
    echo "  delete    Delete the MSK cluster"
    echo "  status    Check deployment status"
    echo "  outputs   Show stack outputs"
    echo "  help      Show this help message"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV     Environment (dev|staging|prod) [default: dev]"
    echo "  -r, --region REGION       AWS region [default: us-east-1]"
    echo "  -v, --vpc-id VPC_ID       VPC ID (required for deploy)"
    echo "  -s, --subnets SUBNETS     Comma-separated subnet IDs (required for deploy)"
    echo "  -g, --security-group SG   Application security group ID (required for deploy)"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh deploy -e dev -v vpc-12345 -s subnet-123,subnet-456 -g sg-789"
    echo "  ./deploy.sh status -e prod"
    echo "  ./deploy.sh outputs -e staging"
}

check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed or not in PATH"
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

deploy_stack() {
    local environment="$1"
    local vpc_id="$2"
    local subnets="$3"
    local security_group="$4"
    
    if [[ -z "$vpc_id" || -z "$subnets" || -z "$security_group" ]]; then
        print_error "Missing required parameters for deployment"
        show_usage
        exit 1
    fi
    
    print_info "Deploying MSK cluster for environment: $environment"
    print_info "VPC ID: $vpc_id"
    print_info "Subnets: $subnets"
    print_info "Security Group: $security_group"
    
    local stack_name="${STACK_NAME}-${environment}"
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name "$stack_name" --region "$REGION" &> /dev/null; then
        print_info "Stack exists, updating..."
        local action="update-stack"
    else
        print_info "Creating new stack..."
        local action="create-stack"
    fi
    
    # Deploy stack
    aws cloudformation $action \
        --stack-name "$stack_name" \
        --template-body "file://$TEMPLATE_FILE" \
        --parameters \
            "ParameterKey=Environment,ParameterValue=$environment" \
            "ParameterKey=VpcId,ParameterValue=$vpc_id" \
            "ParameterKey=PrivateSubnetIds,ParameterValue=\"$subnets\"" \
            "ParameterKey=ApplicationSecurityGroupId,ParameterValue=$security_group" \
        --capabilities CAPABILITY_NAMED_IAM \
        --region "$REGION" \
        --tags \
            "Key=Environment,Value=$environment" \
            "Key=Application,Value=pixel-studio" \
            "Key=Component,Value=kafka-infrastructure"
    
    print_success "Stack deployment initiated"
    print_info "Waiting for stack to complete (this may take 10-20 minutes)..."
    
    if [[ "$action" == "create-stack" ]]; then
        aws cloudformation wait stack-create-complete --stack-name "$stack_name" --region "$REGION"
    else
        aws cloudformation wait stack-update-complete --stack-name "$stack_name" --region "$REGION"
    fi
    
    print_success "Stack deployment completed!"
    print_info "Getting outputs..."
    show_outputs "$environment"
}

delete_stack() {
    local environment="$1"
    local stack_name="${STACK_NAME}-${environment}"
    
    print_warning "This will delete the MSK cluster and all associated resources!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi
    
    print_info "Deleting stack: $stack_name"
    
    aws cloudformation delete-stack \
        --stack-name "$stack_name" \
        --region "$REGION"
    
    print_info "Stack deletion initiated, waiting for completion..."
    aws cloudformation wait stack-delete-complete --stack-name "$stack_name" --region "$REGION"
    
    print_success "Stack deleted successfully"
}

show_status() {
    local environment="$1"
    local stack_name="${STACK_NAME}-${environment}"
    
    print_info "Checking status for stack: $stack_name"
    
    if aws cloudformation describe-stacks --stack-name "$stack_name" --region "$REGION" &> /dev/null; then
        local status=$(aws cloudformation describe-stacks --stack-name "$stack_name" --region "$REGION" --query 'Stacks[0].StackStatus' --output text)
        print_info "Stack Status: $status"
        
        if [[ "$status" == "CREATE_COMPLETE" || "$status" == "UPDATE_COMPLETE" ]]; then
            show_outputs "$environment"
        fi
    else
        print_warning "Stack not found"
    fi
}

show_outputs() {
    local environment="$1"
    local stack_name="${STACK_NAME}-${environment}"
    
    print_info "Stack Outputs:"
    aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue,Description]' \
        --output table
    
    # Show environment variables for application
    print_info "Environment Variables for Application:"
    local bootstrap_brokers=$(aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`BootstrapBrokerStringTls`].OutputValue' \
        --output text)
    
    echo "KAFKA_BROKERS=$bootstrap_brokers"
    echo "KAFKA_SSL=true"
    echo "KAFKA_CLIENT_ID=pixel-studio"
}

# Main script
main() {
    local command="$1"
    shift || true
    
    local environment="dev"
    local vpc_id=""
    local subnets=""
    local security_group=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                environment="$2"
                shift 2
                ;;
            -r|--region)
                REGION="$2"
                shift 2
                ;;
            -v|--vpc-id)
                vpc_id="$2"
                shift 2
                ;;
            -s|--subnets)
                subnets="$2"
                shift 2
                ;;
            -g|--security-group)
                security_group="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    case $command in
        deploy)
            check_prerequisites
            deploy_stack "$environment" "$vpc_id" "$subnets" "$security_group"
            ;;
        delete)
            check_prerequisites
            delete_stack "$environment"
            ;;
        status)
            check_prerequisites
            show_status "$environment"
            ;;
        outputs)
            check_prerequisites
            show_outputs "$environment"
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            print_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"

pipeline {
    agent any
    
    environment {
        DOCKER_HUB_USER = 'nguyenit3' 
        REGISTRY_CREDENTIALS = 'docker-hub-credentials'
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push Backend') {
            steps {
                script {
                    dir('Express') {
                        def backendImage = docker.build("${DOCKER_HUB_USER}/web-ticket-backend:${BUILD_NUMBER}")
                        docker.withRegistry('', REGISTRY_CREDENTIALS) {
                            backendImage.push()
                            backendImage.push('latest')
                        }
                    }
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                script {
                    dir('Reactjs') {
                        withCredentials([file(credentialsId: 'Frontend', variable: 'ENV_FILE')]) {
                            sh "cp \$ENV_FILE .env.production"
                        }
                        def frontendImage = docker.build("${DOCKER_HUB_USER}/web-ticket-frontend:${BUILD_NUMBER}")
                        docker.withRegistry('', REGISTRY_CREDENTIALS) {
                            frontendImage.push()
                            frontendImage.push('latest')
                        }
                        sh "rm -f .env.production"
                    }
                }
            }
        }

        stage('Deploy To Server') {
            steps {
                script {
                    echo '--- Đang khởi chạy các Container Ứng dụng ---'
                    
                    // 1. Dừng và xóa các container cũ nếu đang chạy để tránh xung đột port
                    sh "docker stop web-ticket-backend web-ticket-frontend || true"
                    sh "docker rm web-ticket-backend web-ticket-frontend || true"
                    
                    // 2. Chạy container Backend (Truyền file env của Backend nằm ở máy Host Ubuntu vào)
                    // Thay đường dẫn '/home/ubuntu/projects/Web_Ticket/Express/.env.production' bằng đường dẫn thực tế file env của bạn nếu khác
                    sh """
                    docker run -d \
                      --name web-ticket-backend \
                      -p 3000:3000 \
                      --env-file /home/ubuntu/projects/Web_Ticket/Express/.env.production \
                      ${DOCKER_HUB_USER}/web-ticket-backend:latest
                    """
                    
                    // 3. Chạy container Frontend (Chạy cổng 80, code React tĩnh đã nhúng sẵn env từ lúc build)
                    sh """
                    docker run -d \
                      --name web-ticket-frontend \
                      -p 80:80 \
                      ${DOCKER_HUB_USER}/web-ticket-frontend:latest
                    """
                    
                    echo '--- Deploy Thành Công! Web đã hoạt động ---'
                }
            }
        }
    }
}
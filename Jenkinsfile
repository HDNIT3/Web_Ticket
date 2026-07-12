pipeline {
    agent any
    
    environment {
        // THAY TÊN USER DOCKER HUB CỦA BẠN VÀO ĐÂY
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
                        // Lấy file Frontend từ Jenkins đặt vào làm file .env.production
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
    }
}
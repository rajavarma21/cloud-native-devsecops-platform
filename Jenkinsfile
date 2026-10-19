
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Validate Docker Compose') {
            steps {
                sh 'docker compose config'
            }
        }
         stage('Backend Tests') {
            steps {
                dir('application/backend') {
                    withEnv(['REDIS_URL=redis://ci-redis:6379']) {
                        sh 'npm ci'
                        sh 'npm test'
                    }
                }
            }
        }
        stage('Dependency Audit') {
            steps {
                dir('application/backend') {
                    sh 'npm audit --audit-level=high'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker build -t cloudforge-backend:ci ./application/backend'
                sh 'docker build -t cloudforge-frontend:ci ./application/frontend'
            }
        }

        stage('Container Image Security Scan') {
            steps {
                sh '''
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v cloudforge-trivy-cache:/root/.cache/ \
                      aquasec/trivy:latest image \
                      --scanners vuln \
                      --severity HIGH,CRITICAL \
                      --exit-code 1 \
                      cloudforge-backend:ci
                '''
                sh '''
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v cloudforge-trivy-cache:/root/.cache/ \
                      aquasec/trivy:latest image \
                      --scanners vuln \
                      --severity HIGH,CRITICAL \
                      --exit-code 1 \
                      cloudforge-frontend:ci
                '''
            }
        }
    }

    post {
        success {
            echo 'CloudForge CI pipeline completed successfully.'
        }
        failure {
            echo 'CloudForge CI pipeline failed. Review the stage logs.'
        }
        always {
            echo 'CI pipeline finished.'
        }
    }
}


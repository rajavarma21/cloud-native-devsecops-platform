
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

        stage('Backend Tests') {
            steps {
                dir('application/backend') {
                    sh 'npm ci'
                    sh 'npm test'
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


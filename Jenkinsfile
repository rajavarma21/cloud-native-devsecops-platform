
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

        stage('Prepare Reports') {
            steps {
                sh 'mkdir -p reports'
            }
        }

        stage('Validate Docker Compose') {
            steps {
                sh 'docker compose config > /dev/null'
            }
        }

        stage('Backend Tests') {
            steps {
                dir('application/backend') {
                    withEnv(['REDIS_URL=redis://ci-redis:6379']) {
                        sh 'npm ci'
                        sh '''
                            npm test -- \
                              --test-reporter=junit \
                              --test-reporter-destination=../../reports/backend-junit.xml
                        '''
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
                      -v "$WORKSPACE/reports:/reports" \
                      aquasec/trivy:latest image \
                      --scanners vuln \
                      --severity HIGH,CRITICAL \
                      --format json \
                      --output /reports/trivy-backend.json \
                      --exit-code 1 \
                      cloudforge-backend:ci
                '''
                sh '''
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v cloudforge-trivy-cache:/root/.cache/ \
                      -v "$WORKSPACE/reports:/reports" \
                      aquasec/trivy:latest image \
                      --scanners vuln \
                      --severity HIGH,CRITICAL \
                      --format json \
                      --output /reports/trivy-frontend.json \
                      --exit-code 1 \
                      cloudforge-frontend:ci
                '''
            }
        }
    }

    post {
        always {
            script {
                if (fileExists('reports/backend-junit.xml')) {
                    junit testResults: 'reports/backend-junit.xml',
                          allowEmptyResults: true
                }

                archiveArtifacts artifacts: 'reports/**',
                                 allowEmptyArchive: true,
                                 fingerprint: true
            }

            echo 'CI pipeline finished.'
        }

        success {
            echo 'CloudForge CI pipeline completed successfully.'
        }

        failure {
            echo 'CloudForge CI pipeline failed. Review the stage logs and archived reports.'
        }
    }
}


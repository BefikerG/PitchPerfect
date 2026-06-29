# Stage 1: Build the Maven application
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy the build definitions and source code
COPY pom.xml .
COPY src ./src

# Compile and package the application, skipping tests for speed
RUN mvn clean package -DskipTests

# Stage 2: Create the final lightweight runtime container
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

# Copy the compiled JAR directly from the build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

# 1. Get a lightweight version of Java 21
FROM eclipse-temurin:21-jdk-alpine

# 2. Create a folder inside the container called /app
WORKDIR /app

# 3. Copy the compiled JAR file you just made into the container
COPY target/*.jar app.jar

# 4. Open port 8081 so your React app can talk to it
EXPOSE 8081

# 5. The command to start the application when the container turns on
ENTRYPOINT ["java", "-jar", "app.jar"]

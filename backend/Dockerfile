FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S duewise && adduser -S duewise -G duewise
WORKDIR /app
COPY --from=build --chown=duewise:duewise /app/build/libs/duewise-0.1.0.jar app.jar
USER duewise
EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","app.jar"]

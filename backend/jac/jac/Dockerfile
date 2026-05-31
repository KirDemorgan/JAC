# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM eclipse-temurin:26-jdk-noble AS builder
WORKDIR /app

# 1. Dependency layer — cache-friendly, rebuilt only when build files change
COPY gradle/          gradle/
COPY gradlew          build.gradle.kts  settings.gradle.kts  ./
RUN chmod +x gradlew && \
    ./gradlew --no-daemon dependencies --quiet 2>&1 | tail -5

# 2. Source build
COPY src/ src/
RUN ./gradlew --no-daemon bootJar -x test --quiet && \
    ls -lh build/libs/*.jar

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM eclipse-temurin:26-jdk-noble AS runtime

# Tools needed for the healthcheck (already in ubuntu-noble base, but explicit)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Non-root user
RUN groupadd -r jac && useradd -r -g jac -d /app jac

COPY --from=builder /app/build/libs/*.jar app.jar
RUN chown jac:jac app.jar

USER jac

EXPOSE 8080

# JVM tuned for containers: honour cgroup memory limits, avoid /dev/random blocking
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]

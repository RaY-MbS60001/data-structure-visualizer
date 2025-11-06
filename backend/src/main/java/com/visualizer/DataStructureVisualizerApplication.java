package com.visualizer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

@SpringBootApplication
public class DataStructureVisualizerApplication {

    public static void main(String[] args) {
        SpringApplication.run(DataStructureVisualizerApplication.class, args);
        System.out.println("\n🚀 Server Running: http://localhost:8080");
        System.out.println("📂 Upload Directory: ./uploads/");
        System.out.println("🔌 WebSocket Endpoint: ws://localhost:8080/ws-visualization\n");
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(@NonNull CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
}

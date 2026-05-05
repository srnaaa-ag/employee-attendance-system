package com.attendance.system.config.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.core.env.Environment;
import lombok.RequiredArgsConstructor;



import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final Environment env;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> {})
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // Public
                        .requestMatchers("/api/auth/**").permitAll()

                        // EMPLOYEE
                        .requestMatchers(HttpMethod.POST, "/api/leave-requests").hasAnyRole("EMPLOYEE","ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/leave-requests/employee/me").hasAnyRole("EMPLOYEE","ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/leave-requests/*/cancel").hasAnyRole("EMPLOYEE","ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/api/profile/**").hasAnyRole("EMPLOYEE", "ADMIN", "SUPER_ADMIN")

                        // ADMIN
                        .requestMatchers(HttpMethod.GET, "/api/leave-requests").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/leave-requests/{id}").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/leave-requests/status/**")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/leave-requests/date-range")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/leave-requests/pending")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN")

                        .requestMatchers(HttpMethod.PATCH, "/api/leave-requests/*/approve")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/leave-requests/*/reject")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN")

                        // SUPER_ADMIN
                        .requestMatchers(HttpMethod.DELETE, "/api/leave-requests/**").hasRole("SUPER_ADMIN")


                        // EMPLOYEE - correction requests
                        .requestMatchers(HttpMethod.POST, "/api/correction-requests").hasAnyRole("EMPLOYEE","ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/correction-requests/employee/me").hasAnyRole("EMPLOYEE","ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/correction-requests/*/cancel").hasAnyRole("EMPLOYEE","ADMIN", "SUPER_ADMIN")

                        // ADMIN - correction requests
                        .requestMatchers(HttpMethod.GET, "/api/correction-requests").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/correction-requests/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/correction-requests/*/approve").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/correction-requests/*/reject").hasAnyRole("ADMIN", "SUPER_ADMIN")

                        // SUPER_ADMIN - correction requests
                        .requestMatchers(HttpMethod.DELETE, "/api/correction-requests/**").hasRole("SUPER_ADMIN")

                        // fallback
                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();

        String allowedOrigins = env.getProperty("cors.allowed.origins", "http://localhost:5173");
        List<String> origins = Arrays.asList(allowedOrigins.split(","));

        corsConfiguration.setAllowedOrigins(origins); 
        corsConfiguration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        corsConfiguration.setAllowedHeaders(List.of("*"));
        corsConfiguration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
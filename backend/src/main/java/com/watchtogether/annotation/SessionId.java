package com.watchtogether.annotation;

import java.lang.annotation.*;

@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface SessionId {
    boolean required() default true;
    String headerName() default "X-Session-Id";
}
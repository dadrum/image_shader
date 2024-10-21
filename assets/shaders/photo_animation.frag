#include <flutter/runtime_effect.glsl>

out vec4 fragColor;
uniform vec2 uSize;
uniform vec2 textureSize;
uniform sampler2D image;
uniform float iTime;

// Функция простого псевдошума на основе координат
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Функция для генерации фрактального шума
float fbm(vec2 uv) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 4; i++) {  // Количество октав для фрактального шума
        value += amplitude * noise(uv * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}

// ---------------------------------------

// Функция для вычисления градиента цвета (разницы между соседними пикселями)
float getEdgeStrength(vec2 uv) {
    // Размер шага для выборки соседних пикселей
    vec2 offset = vec2(2.0) / uSize;

    // Выбираем соседние пиксели
    vec3 colorCenter = texture(image, uv).rgb;
    vec3 colorLeft = texture(image, uv - vec2(offset.x, 0.0)).rgb;
    vec3 colorRight = texture(image, uv + vec2(offset.x, 0.0)).rgb;
    vec3 colorUp = texture(image, uv + vec2(0.0, offset.y)).rgb;
    vec3 colorDown = texture(image, uv - vec2(0.0, offset.y)).rgb;

    // Вычисляем изменение цвета по горизонтали и вертикали
    vec3 gradX = colorRight - colorLeft;
    vec3 gradY = colorUp - colorDown;

    // Градиентная сила (суммируем изменения по всем компонентам RGB)
    float edgeStrength = length(gradX) + length(gradY);

    return edgeStrength;
}

// ---------------------------------------

void main() {
    vec2 iResolution = uSize;
    vec2 fragCoord = FlutterFragCoord();
    vec2 uv = fragCoord / iResolution.xy;

    // -------------------------------------------------
    // Соотношение сторон экрана и текстуры
    float screenAspect = iResolution.x / iResolution.y;
    float textureAspect = textureSize.x / textureSize.y;


    // Масштабирование, чтобы изображение заполнило экран без искажений
    vec2 scale = vec2(1.0);
    vec2 offset = vec2(0.0);

    if (screenAspect > textureAspect) {
        // Экран шире текстуры — масштабируем по высоте
        scale.y =  textureAspect / screenAspect;
        scale.x = 1.0;  // Высота остаётся неизменной
        offset.x = (1.0 - 1.0 / scale.x) / 2.0;  // Центрируем
        offset.y = (1.0 - 1.0 / scale.y) / 2.0;  // Центрируем
    } else {
        // Экран уже текстуры — масштабируем по ширине
        scale.x =  screenAspect / textureAspect;
        scale.y = 1.0;  // Ширина остаётся неизменной
        offset.x = (1.0 - 1.0 / scale.x) / 2.0;  // Центрируем
        offset.y = (1.0 - 1.0 / scale.y) / 2.0;  // Центрируем
    }

    // Применяем масштабирование и смещение к текстурным координатам
    vec2 adjustedUV = (uv - offset) * scale;

    // Получаем цвет из текстуры с новыми координатами, если они в пределах текстуры
    if (adjustedUV.x >= 0.0 && adjustedUV.x <= 1.0 && adjustedUV.y >= 0.0 && adjustedUV.y <= 1.0) {
        fragColor = texture(image, adjustedUV);
    } else {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);  // Заполняем чёрным, если координаты вне текстуры
    }
    vec3 col = fragColor.rgb;
    // -------------------------------------------------

    // -------------------------------------------------
    // ПЕРИОДИЧЕСКИЙ ШУМ НА КРАЯХ
    // Порог для определения "резкого" изменения цвета
    float threshold2 = 0.2 + abs(0.94*sin(iTime*0.75));  // Чем меньше значение, тем более чувствительно

    // Вычисляем силу градиента (изменение цвета в данной точке)
    float edgeStrength = getEdgeStrength(adjustedUV);

    // Если сила градиента больше порога, то рисуем красную обводку
    if (edgeStrength > threshold2) {
        col = col * 2;
    } else {
        //        fragColor = col;  // Оставляем оригинальный цвет
    }
    // -------------------------------------------------

    // -------------------------------------------------
    // ВОЛНЫ
    float threshold = 0.5;  // Порог чувствительности к изменению цвета

    // Получаем цвета соседних пикселей
    vec3 colorRight = texture(image, adjustedUV + vec2(1, 0.0)).rgb;
    vec3 colorLeft = texture(image, adjustedUV - vec2(1, 0.0)).rgb;
    vec3 colorUp = texture(image, adjustedUV + vec2(0.0, 1)).rgb;
    vec3 colorDown = texture(image, adjustedUV - vec2(0.0, 1)).rgb;

    // Вычисляем разницу между текущим цветом и соседними пикселями
    float diffRight = distance(col, colorRight);
    float diffLeft = distance(col, colorLeft);
    float diffUp = distance(col, colorUp);
    float diffDown = distance(col, colorDown);

    // Если разница превышает порог по любому направлению, модифицируем цвет
    if (diffRight > threshold || diffLeft > threshold || diffUp > threshold || diffDown > threshold) {
        // Пример модификации: преобразование в оттенки серого
        float grayscale = dot(col, vec3(0.299, 0.587, 0.114));
        fragColor = vec4(vec3(grayscale), 1.0);  // Оттенки серого


        // Добавляем плавающее смещение на основе синусоиды и времени
        float wave = sin(adjustedUV.x * 5.0 + iTime) * 0.002 + cos(adjustedUV.y * 5.0 + iTime) * 0.002;
        vec2 newUV = adjustedUV + wave * vec2(0.5, 0.5);  // Смещение координат для эффекта жидкости

        // Получаем цвет с новых координат
        vec3 liquidColor = texture(image, newUV).rgb;

        // Устанавливаем цвет с эффектом жидкости
        fragColor = vec4(liquidColor, 1.0);

    } else {
        // Если изменений нет, оставляем исходный цвет
//        fragColor = vec4(col, 1.0);

        // Пример модификации: преобразование в оттенки серого
        float grayscale = dot(col, vec3(0.299, 0.587, 0.114));
        fragColor = vec4(vec3(grayscale), 1.0);  // Оттенки серого


        // Добавляем плавающее смещение на основе синусоиды и времени
        float wave = -sin(adjustedUV.x * 10.0 + iTime) * 0.004 + cos(adjustedUV.y * 5.0 + iTime) * 0.004;
        vec2 newUV = adjustedUV + wave * vec2(0.5, 0.5);  // Смещение координат для эффекта жидкости

        // Получаем цвет с новых координат
        vec3 liquidColor = texture(image, newUV).rgb;

        // Устанавливаем цвет с эффектом жидкости
        fragColor = vec4(liquidColor, 1.0);
    }

    // -----------------------------------------------

    // -----------------------------------------------
    // Цвет тумана
    vec3 fogColor = 2.5 * col;//vec3(3.8, 0.8, 0.8);  // Цвет облаков (светло-серый)

    // Параметры тумана
    float fogDensity = 0.57;  // Регулируйте для изменения плотности тумана
    float fogSpeed = -0.042;    // Скорость движения облаков
    float fogScale = 3.0;    // Масштаб облаков

    // Генерация облаков на основе шума и времени
    vec2 movingUV = adjustedUV * fogScale + vec2(iTime * fogSpeed, iTime * fogSpeed);  // Движение тумана со временем
    float cloudFactor = fbm(movingUV);  // Генерация облаков

//     Вычисляем фактор тумана на основе позиции и плотности
    float fogFactor = smoothstep(0.3, 1.0, cloudFactor * fogDensity);

    // Линейная интерполяция между цветом сцены и туманом
    fragColor.rgb = mix(fragColor.rgb, fogColor, fogFactor);
}


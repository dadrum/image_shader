import 'package:flutter/material.dart';

import 'animations/image_shder.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Shader photo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const MyHomePage(),
    );
  }
}

class MyHomePage extends StatelessWidget {
  const MyHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return const SafeArea(
      bottom: false,
      child: ColoredBox(
        color: Colors.black,
        child: SafeArea(
          child: Stack(
            fit: StackFit.expand,
            children: [
              /// Анимированный фон
              Positioned.fill(
                child: ImageShader(
                  imageFromAssets: true,
                  imagePath: 'assets/images/image.webp',
                ),
              ),

              /// Заголовок
              Center(
                  child: Material(
                color: Colors.transparent,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'MY APP NAME',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Colors.white70,
                        fontSize: 30,
                      ),
                    ),
                    Text(
                      'The best of the best',
                      style: TextStyle(
                        fontWeight: FontWeight.w400,
                        color: Colors.white70,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              )),
            ],
          ),
        ),
      ),
    );
  }
}

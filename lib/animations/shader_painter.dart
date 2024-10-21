import 'dart:ui';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

class ShaderPainter extends CustomPainter {
  ShaderPainter(FragmentShader fragmentShader, this.uniforms, this.image)
      : shader = fragmentShader;

  final FragmentShader shader;
  final List<double> uniforms;
  final ui.Image image;

  @override
  void paint(Canvas canvas, Size size) {
    shader.setImageSampler(0, image);

    shader
      ..setFloat(0, size.width)
      ..setFloat(1, size.height);
    shader
      ..setFloat(2, image.width.toDouble())
      ..setFloat(3, image.height.toDouble());

    for (var i = 0; i < uniforms.length; i++) {
      shader.setFloat(i + 4, uniforms[i]);
    }

    final paint = Paint()..shader = shader;
    canvas.drawRect(Offset.zero & size, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

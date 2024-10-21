import 'dart:async';
import 'dart:io';
import 'dart:ui';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'shader_painter.dart';

class ImageShader extends StatefulWidget {
  const ImageShader({
    super.key,
    required this.imageFromAssets,
    required this.imagePath,
  });

  final bool imageFromAssets;
  final String imagePath;

  @override
  State<ImageShader> createState() => _ImageShaderState();
}

class _ImageShaderState extends State<ImageShader> {
  late Timer timer;
  double delta = 0;
  FragmentShader? shader;
  ui.Image? image;

  // ---------------------------------------------------------------------------
  Future<void> loadMyShader() async {
    if (widget.imageFromAssets) {
      final imageData = await rootBundle.load(widget.imagePath);
      image = await decodeImageFromList(imageData.buffer.asUint8List());
    } else {
      final imageData = File.fromUri(
        Uri.file(widget.imagePath),
      ).readAsBytesSync();
      image = await decodeImageFromList(imageData.buffer.asUint8List());
    }

    var program =
        await FragmentProgram.fromAsset('assets/shaders/photo_animation.frag');
    shader = program.fragmentShader();
    setState(() {
      // trigger a repaint
    });

    timer = Timer.periodic(const Duration(milliseconds: 16), (timer) {
      setState(() {
        delta += 1 / 60;
      });
    });
  }

  // ---------------------------------------------------------------------------
  @override
  void initState() {
    super.initState();
    loadMyShader();
  }

  // ---------------------------------------------------------------------------
  @override
  void dispose() {
    timer.cancel();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    if (shader == null) {
      return const Center(child: CircularProgressIndicator());
    } else {
      return CustomPaint(painter: ShaderPainter(shader!, [delta], image!));
    }
  }
}

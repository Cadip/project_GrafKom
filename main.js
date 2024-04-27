function main(){
    //setup
    var CANVAS  = document.getElementById("mycanvas");
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    var GL;
    try{
        GL = CANVAS.getContext("webgl",{antialias: true});
    }catch(e){
        alert(e);
        return false;
    }

    //shader
    var shader_vertex_source = `
        attribute vec2 position;
        attribute vec3 color;

        varying vec3 outColor; 
        void main(void){
            gl_Position = vec4(position, 0., 1.);
            outColor = color;
        }
    `;
    var shader_fragment_source = `
        precision mediump float;
        
        varying vec3 outColor; 
        void main(void){
            gl_FragColor = vec4(outColor,1.);
        }
    `;

    var compile_shader = function(source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
          alert("ERROR IN " + typeString + " SHADER: " + GL.getShaderInfoLog(shader));
          return false;
        }
        return shader;
    };

    var shader_vertex = compile_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
    var shader_fragment = compile_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

    var SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(SHADER_PROGRAM,shader_vertex);
    GL.attachShader(SHADER_PROGRAM,shader_fragment);
    GL.linkProgram(SHADER_PROGRAM);

    var uniform_color = GL.getUniformLocation(SHADER_PROGRAM, "outColor");

    //vao
    var position_vao = GL.getAttribLocation(SHADER_PROGRAM, "position");
    var color_vao = GL.getAttribLocation(SHADER_PROGRAM, "color");
    GL.enableVertexAttribArray(position_vao);
    GL.enableVertexAttribArray(color_vao);
    GL.useProgram(SHADER_PROGRAM);

    //ATAS
    var numSegments = 100;
    var radiusX = 0.175;
    var radiusY = 0.45;
    var centerX = 0.0;
    var centerY = 0.0;
    var anglePerSegment = Math.PI / numSegments;
    var halfCircleVertices = [];
    var color = [1, 1, 1]; 
    for (var i = 0; i <= numSegments; i++) {
        var angle = anglePerSegment * i;
        var x = centerX + Math.cos(angle) * radiusX;
        var y = centerY + Math.sin(angle) * radiusY;
        halfCircleVertices.push(x, y, color[1], color[1], color[1]);
    }

    var numSegments4 = 100;
    var radiusX4 = 0.15;
    var radiusY4= 0.4;
    var centerX4 = 0.0;
    var centerY4 = 0.0;
    var anglePerSegment4 = Math.PI / numSegments4;
    var halfCircleVertices3 = [];
    var color3 = [0, 0, 0]; 
    for (var i = 0; i <= numSegments4; i++) {
        var angle4 = anglePerSegment4 * i;
        var x = centerX4 + Math.cos(angle4) * radiusX4;
        var y = centerY4 + Math.sin(angle4) * radiusY4;
        halfCircleVertices3.push(x, y, color3[1], color3[1], color3[1]);
    }

    // BAWAH
    var numSegments2 = 100;
    var radiusXB = 0.22;
    var radiusYB = 0.15;
    var centerX2 = 0.0;
    var centerY2 = -0.4;
    var anglePerSegment2 = Math.PI / numSegments2;
    var halfCircleVertices2 = [];
    for (var i = 0; i <= numSegments2; i++) {
        var angle2 = anglePerSegment2 * i;
        var x = centerX2 + Math.cos(angle2) * radiusXB * -1;
        var y = centerY2 + Math.sin(angle2) * radiusYB * -1;
        halfCircleVertices2.push(x, y, color[1], color[1], color[1]);
    }

    // LINGKARAN TENGAH
    var numSegments3 = 100;
    var radiusX2 = 0.025;
    var radiusY2 = 0.05;
    var centerX3 = 0.0;
    var centerY3 = -0.2;
    var anglePerSegment3 = (2 * Math.PI) / numSegments3;
    var color2 = [1, 0, 0];

    var circleVertices3 = [];
    for (var i = 0; i <= numSegments3; i++) {
        var angle3 = anglePerSegment3 * i;
        var x = centerX3 + Math.cos(angle3) * radiusX2;
        var y = centerY3 + Math.sin(angle3) * radiusY2;
        circleVertices3.push(x, y, color2[1], color2[1], color2[1]);
    }

    // KOTAK
    var house_vertices = [
        -0.22,0,
        0.22,0,            
        -0.22,-0.4,         
        0.22,-0.4,          
    ];

    // KOTAK TENGAH
    var house_vertices2 = [
        -0.012,-0.32,
        0.012,-0.32,            
        -0.012,-0.2,         
        0.012,-0.2,          
    ];
    
    //vbo
    // ATAS
    var halfCircle_vbo = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, halfCircle_vbo);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(halfCircleVertices), GL.STATIC_DRAW);

    var halfCircle_vbo3 = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, halfCircle_vbo3);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(halfCircleVertices3), GL.STATIC_DRAW);

    // BAWAH
    var halfCircle_vbo2 = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, halfCircle_vbo2);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(halfCircleVertices2), GL.STATIC_DRAW);

    // LINGKARAN TENGAH
    var circle_vbo = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, circle_vbo);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(circleVertices3), GL.STATIC_DRAW);

    // KOTAK
    var house_vbo = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, house_vbo);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(house_vertices), GL.STATIC_DRAW);

    // KOTAK TENGAH
    var house_vbo2 = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, house_vbo2);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(house_vertices2), GL.STATIC_DRAW);

    var house_elements = [
        0,1,2,
        1,2,3
    ];
    var house_elements2 = [
        0,1,2,
        1,2,3
    ];

    // KOTAK
    var house_ebo = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, house_ebo);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(house_elements), GL.STATIC_DRAW);

    // KOTAK TENGAH
    var house_ebo2 = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, house_ebo2);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(house_elements2), GL.STATIC_DRAW);

    //Drawing
    GL.clearColor(0.0,0.0,0.0,0.0);
  
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
  
    GL.clearDepth(1.0);

    var animate = function(){
        GL.viewport(0,0,CANVAS.width,CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT);
  
        // LIBS.translateZ(MOVEMATRIX, 0.1);
        GL.clearColor(0,0,0,0);
        GL.clear(GL.COLOR_BUFFER_BIT);
        
        // ATAS
        GL.bindBuffer(GL.ARRAY_BUFFER, halfCircle_vbo);
        GL.vertexAttribPointer(position_vao, 2, GL.FLOAT, false, 5*4, 0);
        GL.vertexAttribPointer(color_vao, 3, GL.FLOAT, false, 5*4, 2*4);
        GL.drawArrays(GL.TRIANGLE_FAN, 0, halfCircleVertices.length/5);

        GL.bindBuffer(GL.ARRAY_BUFFER, halfCircle_vbo3);
        GL.vertexAttribPointer(position_vao, 2, GL.FLOAT, false, 5*4, 0);
        GL.vertexAttribPointer(color_vao, 3, GL.FLOAT, false, 5*4, 2*4);
        GL.drawArrays(GL.TRIANGLE_FAN, 0, halfCircleVertices3.length/5);

        // BAWAH
        GL.bindBuffer(GL.ARRAY_BUFFER, halfCircle_vbo2);
        GL.vertexAttribPointer(position_vao, 2, GL.FLOAT, false, 5*4, 0);
        GL.vertexAttribPointer(color_vao, 3, GL.FLOAT, false, 5*4, 2*4);
        GL.drawArrays(GL.TRIANGLE_FAN, 0, halfCircleVertices2.length/5);

        // KOTAK
        GL.bindBuffer(GL.ARRAY_BUFFER, house_vbo);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, house_ebo);
        GL.vertexAttribPointer(position_vao, 2, GL.FLOAT, false, 2*4, 0);
        GL.drawElements(GL.TRIANGLES, house_elements.length, GL.UNSIGNED_SHORT, 0);

        // LINGKARAN TENGAH
        GL.bindBuffer(GL.ARRAY_BUFFER, circle_vbo);
        GL.vertexAttribPointer(position_vao, 2, GL.FLOAT, false, 5 * 4, 0);
        GL.vertexAttribPointer(color_vao, 3, GL.FLOAT, false, 5 * 4, 2 * 4);
        GL.drawArrays(GL.TRIANGLE_FAN, 0, circleVertices3.length/5); 

        // KOTAK TENGAH
        GL.bindBuffer(GL.ARRAY_BUFFER, house_vbo2);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, house_ebo2);
        GL.vertexAttribPointer(position_vao, 2, GL.FLOAT, false, 2*4, 0);
        GL.drawElements(GL.TRIANGLES, house_elements2.length, GL.UNSIGNED_SHORT, 0);

        GL.flush();

        window.requestAnimationFrame(animate);
    }
    animate();
}

window.addEventListener("load", main);

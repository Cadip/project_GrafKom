var GL;

class myObject {
    object_vertex = [];
    OBJECT_VERTEX = GL.createBuffer();
    //FACES
    object_faces = [];
    OBJECT_FACES = GL.createBuffer();
    child = [];

    //shaders
    shader_vertex_source=`
    attribute vec3 position;
    attribute vec3 color;

    uniform mat4 Pmatrix;
    uniform mat4 Vmatrix;
    uniform mat4 Mmatrix;
    
    varying vec3 vColor;
    void main(void) {
    gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.0);
    vColor = color;
    }`;
    shader_fragment_source =`
    precision mediump float;
    varying vec3 vColor;
    void main(void) {
    gl_FragColor = vec4(vColor, 1.);
    }`;
    
    compile_shader = function(source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
          alert("ERROR IN " + typeString + " SHADER: " + GL.getShaderInfoLog(shader));
          return false;
        }
        return shader;
    };
    
    shader_vertex;
    shader_fragment;
    SHADER_PROGRAM;
    _Pmatrix;
    _Vmatrix;
    _Mmatrix;
    _color;
    _position;
    MOVEMATRIX = LIBS.get_I4();

    constructor(object_vertex, object_faces, shader_vertex_source, shader_fragment_source){
        this.object_vertex = object_vertex;
        this.object_faces = object_faces;
        this.shader_vertex_source = shader_vertex_source;
        this.shader_fragment_source = shader_fragment_source;

        this.shader_vertex = this.compile_shader(this.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
        this.shader_fragment = this.compile_shader(this.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");
        
        this.SHADER_PROGRAM = GL.createProgram();
        GL.attachShader(this.SHADER_PROGRAM, this.shader_vertex);
        GL.attachShader(this.SHADER_PROGRAM, this.shader_fragment);
        GL.linkProgram(this.SHADER_PROGRAM);

        this._Pmatrix = GL.getUniformLocation(this.SHADER_PROGRAM,"Pmatrix");
        this._Vmatrix = GL.getUniformLocation(this.SHADER_PROGRAM,"Vmatrix");
        this._Mmatrix = GL.getUniformLocation(this.SHADER_PROGRAM,"Mmatrix");

        this._color = GL.getAttribLocation(this.SHADER_PROGRAM, "color");
        this._position = GL.getAttribLocation(this.SHADER_PROGRAM, "position");
    
        GL.enableVertexAttribArray(this._color);
        GL.enableVertexAttribArray(this._position);
        GL.useProgram(this.SHADER_PROGRAM);
        this.initializeObject();
    }
    
    initializeObject(){
        GL.bindBuffer(GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(this.object_vertex),GL.STATIC_DRAW);

        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.object_faces),GL.STATIC_DRAW);
    }

    setUniform4(PROJMATRIX, VIEWMATRIX){
        GL.useProgram(this.SHADER_PROGRAM);

        GL.uniformMatrix4fv(this._Pmatrix,false,PROJMATRIX);
        GL.uniformMatrix4fv(this._Vmatrix,false,VIEWMATRIX);
        GL.uniformMatrix4fv(this._Mmatrix,false,this.MOVEMATRIX);
    }
    
    draw(){
        GL.useProgram(this.SHADER_PROGRAM);
        GL.bindBuffer(GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        GL.vertexAttribPointer(this._position, 3, GL.FLOAT, false, 4*(3+3), 0);
        GL.vertexAttribPointer(this._color, 3, GL.FLOAT, false, 4*(3+3), 3*4);

        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        GL.drawElements(GL.TRIANGLES, this.object_faces.length, GL.UNSIGNED_SHORT, 0);

        for (var i = 0; i < this.child.length; i++){
            this.child[i].draw();
        }

    }

    addChild(Child){
        this.child.push(Child);
    }
}

function main(){
    var CANVAS = document.getElementById("mycanvas");

    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
    
    /*========================= CAPTURE MOUSE EVENTS ========================= */
    var AMORTIZATION = 0.95;
    var dX = 0, dY = 0;
    var drag = false;


    var x_prev, y_prev;

    var mouseDown = function(e) {
      drag = true;
      x_prev = e.pageX, y_prev = e.pageY;
      e.preventDefault();
      return false;
    };

    var mouseUp = function(e){
      drag = false;
    };

    var mouseMove = function(e) {
      if (!drag) return false;
    
      dX = (e.pageX-x_prev) * 2 * Math.PI / CANVAS.width,
      dY = (e.pageY-y_prev) * 2 * Math.PI / CANVAS.height;
      THETA += dX;
      PHI += dY;
      x_prev = e.pageX, y_prev = e.pageY;
      e.preventDefault();
    };

    CANVAS.addEventListener("mousedown", mouseDown, false);
    CANVAS.addEventListener("mouseup", mouseUp, false);
    CANVAS.addEventListener("mouseout", mouseUp, false);
    CANVAS.addEventListener("mousemove", mouseMove, false);

    
    try{
        GL = CANVAS.getContext("webgl", {antialias: true});
    }catch(e){
        alert("WebGL context cannot be initialized");
        return false;
    }

    //shaders
    var shader_vertex_source=`
    attribute vec3 position;
    attribute vec3 color;

    uniform mat4 Pmatrix;
    uniform mat4 Vmatrix;
    uniform mat4 Mmatrix;
    
    varying vec3 vColor;
    void main(void) {
    gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.0);
    vColor = color;
    }`;
    var shader_fragment_source =`
    precision mediump float;
    varying vec3 vColor;
    void main(void) {
    gl_FragColor = vec4(vColor, 1.);
    }`;

    // KEPALA
    var sectorCount1 = 100;
    var stackCount1 = 100;
    var radius1 = 2;

    var a1, b1, c1, xy1;
    var sectorStep1 = 2 * Math.PI / sectorCount1;
    var stackStep1 = Math.PI / stackCount1;
    var sectorAngle1, stackAngle1;
    var A_vertices1 = [];
    for (var i = 0; i <= stackCount1; ++i) {
        stackAngle1 = Math.PI / 2 - i * stackStep1;
        xy1 = radius1 * Math.cos(stackAngle1);
        c1 = radius1 * Math.sin(stackAngle1);
        for (var j = 0; j <= sectorCount1; ++j) {
            sectorAngle1 = j * sectorStep1;
            a1 = xy1 * Math.cos(sectorAngle1);
            b1 = xy1 * Math.sin(sectorAngle1);
            A_vertices1.push(a1);
            A_vertices1.push(b1);
            A_vertices1.push(c1);
            A_vertices1.push(1);
            A_vertices1.push(1);
            A_vertices1.push(1);
        }
    }
    
    var k1, k2;
    var A_faces1 = [];
    for (var i = 0; i < stackCount1; ++i) {
        k1 = i * (sectorCount1 + 1);
        k2 = k1 + sectorCount1 + 1;
        for (var j = 0; j < sectorCount1; ++j, ++k1, ++k2) {
            if (i != 0) {
                A_faces1.push(k1);
                A_faces1.push(k2);
                A_faces1.push(k1 + 1);
            }
            if (i != (stackCount1 - 1)) {
                A_faces1.push(k1 + 1);
                A_faces1.push(k2);
                A_faces1.push(k2 + 1);
            }
        }
    }

    // HIDUNG
    var sectorCount2 = 100;
    var stackCount2 = 100;
    var radius2 = 0.3;

    var a2, b2, c2, xy2;
    var sectorStep2 = 2 * Math.PI / sectorCount2;
    var stackStep2 = Math.PI / stackCount2;
    var sectorAngle2, stackAngle2;
    var A_vertices2 = [];
    for (var i = 0; i <= stackCount2; ++i) {
        stackAngle2 = Math.PI / 2 - i * stackStep2;
        xy2 = radius2 * Math.cos(stackAngle2);
        c2 = radius2 * Math.sin(stackAngle2);
        for (var j = 0; j <= sectorCount2; ++j) {
            sectorAngle2 = j * sectorStep2;
            a2 = xy2 * Math.cos(sectorAngle2);
            b2 = xy2 * Math.sin(sectorAngle2);
            A_vertices2.push(a2);
            A_vertices2.push(b2);
            A_vertices2.push(c2);
            A_vertices2.push(0);
            A_vertices2.push(0);
            A_vertices2.push(0);
        }
    }
    
    var k1, k2;
    var A_faces2 = [];
    for (var i = 0; i < stackCount2; ++i) {
        k1 = i * (sectorCount2 + 1);
        k2 = k1 + sectorCount2 + 1;
        for (var j = 0; j < sectorCount2; ++j, ++k1, ++k2) {
            if (i != 0) {
                A_faces2.push(k1);
                A_faces2.push(k2);
                A_faces2.push(k1 + 1);
            }
            if (i != (stackCount2 - 1)) {
                A_faces2.push(k1 + 1);
                A_faces2.push(k2);
                A_faces2.push(k2 + 1);
            }
        }
    }

    // MULUT
    var sectorCount3 = 100;
    var stackCount3 = 100;
    var radius3 = 1.3;

    var a3, b3, c3, xy3;
    var sectorStep3 = 2 * Math.PI / sectorCount3;
    var stackStep3 = Math.PI / stackCount3;
    var sectorAngle3, stackAngle3;
    var A_vertices3 = [];
    for (var i = 0; i <= stackCount3; ++i) {
        stackAngle3 = Math.PI / 2 - i * stackStep3;
        xy3 = radius3 * Math.cos(stackAngle3);
        c3 = radius3 * Math.sin(stackAngle3);
        for (var j = 0; j <= sectorCount3/2; ++j) {
            sectorAngle3 = j * sectorStep3;
            a3 = xy3 * Math.cos(sectorAngle3);
            b3 = xy3 * Math.sin(sectorAngle3);
            A_vertices3.push(-a3);
            A_vertices3.push(-b3);
            A_vertices3.push(-c3);
            A_vertices3.push(0.95);
            A_vertices3.push(0.95);
            A_vertices3.push(0.95);
        }
    }
    
    var k1, k2;
    var A_faces3 = [];
    for (var i = 0; i < stackCount3; ++i) {
        k1 = i * (sectorCount3 + 1);
        k2 = k1 + sectorCount3 + 1;
        for (var j = 0; j < sectorCount3; ++j, ++k1, ++k2) {
            if (i != 0) {
                A_faces3.push(k1);
                A_faces3.push(k2);
                A_faces3.push(k1 + 1);
            }
            if (i != (stackCount3 - 1)) {
                A_faces3.push(k1 + 1);
                A_faces3.push(k2);
                A_faces3.push(k2 + 1);
            }
        }
    }

    // KUPING
    var A_vertices4 = [];
    for (var u = -Math.PI; u <= Math.PI; u+=Math.PI/30) {
        for (var v = -Math.PI/2; v < Math.PI/2; v+=Math.PI/30) {
            // Elliptic paraboloid
            A_vertices4.push(1.5 * 0.5 * v * Math.cos(u));
            A_vertices4.push(1.5 * 0.375 * v * Math.sin(u));
            A_vertices4.push(Math.pow(v, 2));
            
            A_vertices4.push(1);
			A_vertices4.push(1);
			A_vertices4.push(1);
        }
    }

    var A_faces4 = [];
    for (var i = 0;i < A_vertices4.length/6; i++) {
        A_faces4.push(0);  
        A_faces4.push(i);  
        A_faces4.push(i+1);  
    }

    // MATA
    var A_vertices5 = [];
    for (var u = -Math.PI; u <= Math.PI; u+=Math.PI/180) {
        for (var v = -Math.PI/2; v < Math.PI/2; v+=Math.PI/180) {
            // Ellipsoid
            A_vertices5.push(2 * Math.cos(v) * Math.cos(u));
            A_vertices5.push(1.5 * Math.cos(v) * Math.sin(u));
            A_vertices5.push(Math.sin(v));
            
            A_vertices5.push(0);
			A_vertices5.push(0);
			A_vertices5.push(0);
        }
    }

    var A_faces5 = [];
    for (var i = 0;i < A_vertices5.length/6; i++) {
        A_faces5.push(0);  
        A_faces5.push(i);  
        A_faces5.push(i+1);  
    }

    // BOLA MATA
    var sectorCount6 = 100;
    var stackCount6 = 100;
    var radius6 = 0.15;

    var a6, b6, c6, xy6;
    var sectorStep6 = 2 * Math.PI / sectorCount6;
    var stackStep6 = Math.PI / stackCount6;
    var sectorAngle6, stackAngle6;
    var A_vertices6 = [];
    for (var i = 0; i <= stackCount6; ++i) {
        stackAngle6 = Math.PI / 2 - i * stackStep6;
        xy6 = radius6 * Math.cos(stackAngle6);
        c6 = radius6 * Math.sin(stackAngle6);
        for (var j = 0; j <= sectorCount6; ++j) {
            sectorAngle6 = j * sectorStep6;
            a6 = xy6 * Math.cos(sectorAngle6);
            b6 = xy6 * Math.sin(sectorAngle6);
            A_vertices6.push(a6);
            A_vertices6.push(b6);
            A_vertices6.push(c6);
            A_vertices6.push(0);
            A_vertices6.push(0);
            A_vertices6.push(0);
        }
    }
    
    var k1, k2;
    var A_faces6 = [];
    for (var i = 0; i < stackCount6; ++i) {
        k1 = i * (sectorCount6 + 1);
        k2 = k1 + sectorCount6 + 1;
        for (var j = 0; j < sectorCount6; ++j, ++k1, ++k2) {
            if (i != 0) {
                A_faces6.push(k1);
                A_faces6.push(k2);
                A_faces6.push(k1 + 1);
            }
            if (i != (stackCount6 - 1)) {
                A_faces6.push(k1 + 1);
                A_faces6.push(k2);
                A_faces6.push(k2 + 1);
            }
        }
    }

    // LEHER
    var sectorCount7 = 100;
    var stackCount7 = 100;
    var radius7 = 1;

    var a7, b7, c7, xy7;
    var sectorStep7 = 2 * Math.PI / sectorCount7;
    var stackStep7 = Math.PI / stackCount7;
    var sectorAngle7, stackAngle7;
    var A_vertices7 = [];
    for (var i = 0; i <= stackCount7; ++i) {
        stackAngle7 = Math.PI / 2 - i * stackStep7;
        xy7 = radius7 * Math.cos(stackAngle7);
        c7 = radius7 * Math.sin(stackAngle7);
        for (var j = 0; j <= sectorCount7; ++j) {
            sectorAngle7 = j * sectorStep7;
            a7 = 1.5 * xy7 * Math.cos(sectorAngle7);
            b7 = xy7 * Math.sin(sectorAngle7);
            A_vertices7.push(a7);
            A_vertices7.push(b7);
            A_vertices7.push(c7);
            A_vertices7.push(1);
            A_vertices7.push(0);
            A_vertices7.push(0);
        }
    }
    
    var k1, k2;
    var A_faces7 = [];
    for (var i = 0; i < stackCount7; ++i) {
        k1 = i * (sectorCount7 + 1);
        k2 = k1 + sectorCount7 + 1;
        for (var j = 0; j < sectorCount7; ++j, ++k1, ++k2) {
            if (i != 0) {
                A_faces7.push(k1);
                A_faces7.push(k2);
                A_faces7.push(k1 + 1);
            }
            if (i != (stackCount7 - 1)) {
                A_faces7.push(k1 + 1);
                A_faces7.push(k2);
                A_faces7.push(k2 + 1);
            }
        }
    }

    // BADAN
    var sectorCount8 = 100;
    var stackCount8 = 100;
    var radius8 = 1.5;

    var a8, b8, c8, xy8;
    var sectorStep8 = 2 * Math.PI / sectorCount8;
    var stackStep8 = Math.PI / stackCount8;
    var sectorAngle8, stackAngle8;
    var A_vertices8 = [];
    for (var i = 0; i <= stackCount8; ++i) {
        stackAngle8 = Math.PI / 2 - i * stackStep8;
        xy8 = radius8 * Math.cos(stackAngle8);
        c8 = radius8 * Math.sin(stackAngle8);
        for (var j = 0; j <= sectorCount8; ++j) {
            sectorAngle8 = j * sectorStep8;
            a8 = 1.0 * xy8 * Math.cos(sectorAngle8);
            b8 = 1.3 * xy8 * Math.sin(sectorAngle8);
            A_vertices8.push(a8);
            A_vertices8.push(b8);
            A_vertices8.push(c8);
            A_vertices8.push(1);
            A_vertices8.push(1);
            A_vertices8.push(1);
        }
    }
    
    var k1, k2;
    var A_faces8 = [];
    for (var i = 0; i < stackCount8; ++i) {
        k1 = i * (sectorCount8 + 1);
        k2 = k1 + sectorCount8 + 1;
        for (var j = 0; j < sectorCount8; ++j, ++k1, ++k2) {
            if (i != 0) {
                A_faces8.push(k1);
                A_faces8.push(k2);
                A_faces8.push(k1 + 1);
            }
            if (i != (stackCount8 - 1)) {
                A_faces8.push(k1 + 1);
                A_faces8.push(k2);
                A_faces8.push(k2 + 1);
            }
        }
    }

    // TANGAN
    var sectorCount9 = 100;
    var stackCount9 = 100;
    var radius9 = 0.5;

    var a9, b9, c9, xy9;
    var sectorStep9 = 2 * Math.PI / sectorCount9;
    var stackStep9 = Math.PI / stackCount9;
    var sectorAngle9, stackAngle9;
    var A_vertices9 = [];
    for (var i = 0; i <= stackCount9; ++i) {
        stackAngle9 = Math.PI / 2 - i * stackStep9;
        xy9 = radius9 * Math.cos(stackAngle9);
        c9 = radius9 * Math.sin(stackAngle9);
        for (var j = 0; j <= sectorCount9; ++j) {
            sectorAngle9 = j * sectorStep9;
            a9 = xy9 * Math.cos(sectorAngle9);
            b9 = 2.5 * xy9 * Math.sin(sectorAngle9);
            A_vertices9.push(a9);
            A_vertices9.push(b9);
            A_vertices9.push(c9);
            A_vertices9.push(1);
            A_vertices9.push(1);
            A_vertices9.push(1);
        }
    }
    
    var k1, k2;
    var A_faces9 = [];
    for (var i = 0; i < stackCount9; ++i) {
        k1 = i * (sectorCount9 + 1);
        k2 = k1 + sectorCount9 + 1;
        for (var j = 0; j < sectorCount9; ++j, ++k1, ++k2) {
            if (i != 0) {
                A_faces9.push(k1);
                A_faces9.push(k2);
                A_faces9.push(k1 + 1);
            }
            if (i != (stackCount9 - 1)) {
                A_faces9.push(k1 + 1);
                A_faces9.push(k2);
                A_faces9.push(k2 + 1);
            }
        }
    }

    // KAKI
    function deg_to_rad(deg){
        return deg*(Math.PI / 180);
    }
    function getX(teta, r){
        return r * Math.cos(teta);
    }
    function getY(teta, r){
        return r * Math.sin(teta);
    }

    var A_vertices10 = [0,0,0,0,1,1]; //index 0
    //lingkaran e
    for (var i = 1; i <= 360; i++){
        x = getX(deg_to_rad(i), 1) / 2;
        y = getY(deg_to_rad(i), 1) / 2;
        A_vertices10.push(x);
        A_vertices10.push(y);
        A_vertices10.push(0); //z
        A_vertices10.push(1);
        A_vertices10.push(1);
        A_vertices10.push(1);
    }; //index 1-360
    
    //tengah atas
    A_vertices10.push(x);
    A_vertices10.push(y);
    A_vertices10.push(zTitikPuncak); //z
    A_vertices10.push(1);
    A_vertices10.push(1);
    A_vertices10.push(1);
    //index 361

    var zTitikPuncak = 1.6;
    //atap e
    for (var i = 1; i <= 360; i++){
        x = 0.8 * getX(deg_to_rad(i), 1) / 2;
        y = getY(deg_to_rad(i), 1) / 2;
        A_vertices10.push(x);
        A_vertices10.push(y);
        A_vertices10.push(zTitikPuncak); //z
        A_vertices10.push(1);
        A_vertices10.push(1);
        A_vertices10.push(1);
    };//index 362-721

    var A_faces10 = []; //berlawanan jarum jam kalo bisa dari index 0 -> 1 -> 2
    for (var i = 0; i <= 360; i++){
        A_faces10.push(0);
        A_faces10.push(i);
        A_faces10.push(i+1);
    }
    A_faces10.push(0);
    A_faces10.push(1);
    A_faces10.push(360);
    //tinggi 
    for (var i = 1; i <= 360; i++){
        A_faces10.push(i);
        A_faces10.push(i+1);
        A_faces10.push(i+361);
        
        A_faces10.push(i+1);
        A_faces10.push(i+362);
        A_faces10.push(i+361);
    }
    A_faces10.push(1);
    A_faces10.push(360);
    A_faces10.push(362);
    
    A_faces10.push(360);
    A_faces10.push(362);
    A_faces10.push(721);
    for (var i = 0; i <= 360; i++){
        A_faces10.push(0+362);
        A_faces10.push(i+362);
        A_faces10.push(i+363);
    }

    // KALUNG
    var A_vertices11 = [0,0,0,0,1,1]; //index 0
    //lingkaran e
    for (var i = 1; i <= 360; i++){
        x = getX(deg_to_rad(i), 1) / 6;
        y = getY(deg_to_rad(i), 1) / 6;
        A_vertices11.push(x);
        A_vertices11.push(y);
        A_vertices11.push(0); //z
        A_vertices11.push(1);
        A_vertices11.push(1);
        A_vertices11.push(1);
    }; //index 1-360

    var zTitikPuncak = 0.25;
    //atap e
    for (var i = 1; i <= 360; i++){
        // x = getX(deg_to_rad(i), 1) / 2;
        // y = getY(deg_to_rad(i), 1) / 2;
        A_vertices11.push(x);
        A_vertices11.push(y);
        A_vertices11.push(zTitikPuncak); //z
        A_vertices11.push(1);
        A_vertices11.push(1);
        A_vertices11.push(1);
    };//index 362-721

    var A_faces11 = []; //berlawanan jarum jam kalo bisa dari index 0 -> 1 -> 2
    for (var i = 0; i <= 360; i++){
        A_faces11.push(0);
        A_faces11.push(i);
        A_faces11.push(i+1);
    }
    A_faces11.push(0);
    A_faces11.push(1);
    A_faces11.push(360);
    //tinggi 
    for (var i = 1; i <= 360; i++){
        A_faces11.push(i);
        A_faces11.push(i+1);
        A_faces11.push(i+361);
        
        A_faces11.push(i+1);
        A_faces11.push(i+362);
        A_faces11.push(i+361);
    }
    A_faces11.push(1);
    A_faces11.push(360);
    A_faces11.push(362);
    
    A_faces11.push(360);
    A_faces11.push(362);
    A_faces11.push(721);
    for (var i = 0; i <= 360; i++){
        A_faces11.push(0+362);
        A_faces11.push(i+362);
        A_faces11.push(i+363);
    }

    // KEPALA bawah
    var sectorCount1 = 100;
    var stackCount1 = 100;
    var radius1 = 2;

    var a1, b1, c1, xy1;
    var sectorStep1 = 2 * Math.PI / sectorCount1;
    var stackStep1 = Math.PI / stackCount1;
    var sectorAngle1, stackAngle1;
    var Z_vertices1 = [];
    for (var i = 0; i <= stackCount1; ++i) {
        stackAngle1 = Math.PI / 2 - i * stackStep1;
        xy1 = radius1 * Math.cos(stackAngle1);
        c1 = radius1 * Math.sin(stackAngle1);
        for (var j = 0; j <= sectorCount1; ++j) {
            sectorAngle1 = j * sectorStep1;
            a1 = xy1 * Math.cos(sectorAngle1);
            b1 = xy1 * Math.sin(sectorAngle1);
            Z_vertices1.push(a1);
            Z_vertices1.push(b1);
            Z_vertices1.push(c1);
            Z_vertices1.push(1);
            Z_vertices1.push(0.9);
            Z_vertices1.push(0.7);
        }
    }
    
    var k1, k2;
    var Z_faces1 = [];
    for (var i = 0; i < stackCount1; ++i) {
        k1 = i * (sectorCount1 + 1);
        k2 = k1 + sectorCount1 + 1;
        for (var j = 0; j < sectorCount1; ++j, ++k1, ++k2) {
            if (i != 0) {
                Z_faces1.push(k1);
                Z_faces1.push(k2);
                Z_faces1.push(k1 + 1);
            }
            if (i != (stackCount1 - 1)) {
                Z_faces1.push(k1 + 1);
                Z_faces1.push(k2);
                Z_faces1.push(k2 + 1);
            }
        }
    }

    
    // HIDUNG
    var sectorCount2 = 100;
    var stackCount2 = 100;
    var radius2 = 0.3;

    var a2, b2, c2, xy2;
    var sectorStep2 = 2 * Math.PI / sectorCount2;
    var stackStep2 = Math.PI / stackCount2;
    var sectorAngle2, stackAngle2;
    var Z_vertices2 = [];
    for (var i = 0; i <= stackCount2; ++i) {
        stackAngle2 = Math.PI / 2 - i * stackStep2;
        xy2 = radius2 * Math.cos(stackAngle2);
        c2 = radius2 * Math.sin(stackAngle2);
        for (var j = 0; j <= sectorCount2; ++j) {
            sectorAngle2 = j * sectorStep2;
            a2 = xy2 * Math.cos(sectorAngle2);
            b2 = xy2 * Math.sin(sectorAngle2);
            Z_vertices2.push(a2);
            Z_vertices2.push(b2);
            Z_vertices2.push(c2);
            Z_vertices2.push(0);
            Z_vertices2.push(0);
            Z_vertices2.push(0);
        }
    }
    
    var k1, k2;
    var Z_faces2 = [];
    for (var i = 0; i < stackCount2; ++i) {
        k1 = i * (sectorCount2 + 1);
        k2 = k1 + sectorCount2 + 1;
        for (var j = 0; j < sectorCount2; ++j, ++k1, ++k2) {
            if (i != 0) {
                Z_faces2.push(k1);
                Z_faces2.push(k2);
                Z_faces2.push(k1 + 1);
            }
            if (i != (stackCount2 - 1)) {
                Z_faces2.push(k1 + 1);
                Z_faces2.push(k2);
                Z_faces2.push(k2 + 1);
            }
        }
    }

    // MULUT
    var sectorCount3 = 100;
    var stackCount3 = 100;
    var radius3 = 1.3;

    var a3, b3, c3, xy3;
    var sectorStep3 = 2 * Math.PI / sectorCount3;
    var stackStep3 = Math.PI / stackCount3;
    var sectorAngle3, stackAngle3;
    var Z_vertices3 = [];
    for (var i = 0; i <= stackCount3; ++i) {
        stackAngle3 = Math.PI / 2 - i * stackStep3;
        xy3 = radius3 * Math.cos(stackAngle3);
        c3 = radius3 * Math.sin(stackAngle3);
        for (var j = 0; j <= sectorCount3/2; ++j) {
            sectorAngle3 = j * sectorStep3;
            a3 = xy3 * Math.cos(sectorAngle3);
            b3 = xy3 * Math.sin(sectorAngle3);
            Z_vertices3.push(-a3);
            Z_vertices3.push(-b3);
            Z_vertices3.push(-c3);
            Z_vertices3.push(1);
            Z_vertices3.push(0);
            Z_vertices3.push(0);
        }
    }
    
    var k1, k2;
    var Z_faces3 = [];
    for (var i = 0; i < stackCount3; ++i) {
        k1 = i * (sectorCount3 + 1);
        k2 = k1 + sectorCount3 + 1;
        for (var j = 0; j < sectorCount3; ++j, ++k1, ++k2) {
            if (i != 0) {
                Z_faces3.push(k1);
                Z_faces3.push(k2);
                Z_faces3.push(k1 + 1);
            }
            if (i != (stackCount3 - 1)) {
                Z_faces3.push(k1 + 1);
                Z_faces3.push(k2);
                Z_faces3.push(k2 + 1);
            }
        }
    }

    // kuping kiri
    var Z_vertices4 = [];
    for (var u = -Math.PI; u <= Math.PI; u+=Math.PI/30) {
        for (var v = -Math.PI/2; v < Math.PI/2; v+=Math.PI/30) {
            // Elliptic paraboloid
            Z_vertices4.push(1.5 * 0.5 * v * Math.cos(u));
            Z_vertices4.push(1.5 * 0.375 * v * Math.sin(u));
            Z_vertices4.push(Math.pow(v, 2));
            
            Z_vertices4.push(1);
            Z_vertices4.push(0.9);
            Z_vertices4.push(0.7);
        }
    }

    var Z_faces4 = [];
    for (var i = 0;i < Z_vertices4.length/6; i++) {
        Z_faces4.push(0);  
        Z_faces4.push(i);  
        Z_faces4.push(i+1);  
    }

    // mata kiri
    var sectorCount5 = 100;
    var stackCount5 = 100;
    var radius5 = 0.1;

    var a5, b5, c5, xy5;
    var sectorStep5 = 2 * Math.PI / sectorCount5;
    var stackStep5 = Math.PI / stackCount5;
    var sectorAngle5, stackAngle5;
    var Z_vertices5 = [];
    for (var i = 0; i <= stackCount5; ++i) {
        stackAngle5 = Math.PI / 2 - i * stackStep5;
        xy5 = radius5 * Math.cos(stackAngle5);
        c5 = radius5 * Math.sin(stackAngle5);
        for (var j = 0; j <= sectorCount5; ++j) {
            sectorAngle5 = j * sectorStep5;
            a5 = xy5 * Math.cos(sectorAngle5);
            b5 = xy5 * Math.sin(sectorAngle5);
            Z_vertices5.push(a5);
            Z_vertices5.push(b5);
            Z_vertices5.push(c5);
            Z_vertices5.push(0);
            Z_vertices5.push(0);
            Z_vertices5.push(0);
        }
    }
    
    var k1, k2;
    var Z_faces5 = [];
    for (var i = 0; i < stackCount5; ++i) {
        k1 = i * (sectorCount5 + 1);
        k2 = k1 + sectorCount5 + 1;
        for (var j = 0; j < sectorCount5; ++j, ++k1, ++k2) {
            if (i != 0) {
                Z_faces5.push(k1);
                Z_faces5.push(k2);
                Z_faces5.push(k1 + 1);
            }
            if (i != (stackCount5 - 1)) {
                Z_faces5.push(k1 + 1);
                Z_faces5.push(k2);
                Z_faces5.push(k2 + 1);
            }
        }
    }

     // KEPALA atas
     var sectorCount6 = 100;
     var stackCount6 = 100;
     var radius6 = 2;
 
     var a6, b6, c6, xy6;
     var sectorStep6 = 2 * Math.PI / sectorCount6;
     var stackStep6 = Math.PI / stackCount6;
     var sectorAngle6, stackAngle6;
     var Z_vertices6 = [];
     for (var i = 0; i <= stackCount6; ++i) {
         stackAngle6 = Math.PI / 2 - i * stackStep6;
         xy6 = radius6 * Math.cos(stackAngle6);
         c6 = radius6 * Math.sin(stackAngle6);
         for (var j = 0; j <= sectorCount6; ++j) {
             sectorAngle6 = j * sectorStep6;
             a6 = xy6 * Math.cos(sectorAngle6);
             b6 = xy6 * Math.sin(sectorAngle6);
             Z_vertices6.push(a6);
             Z_vertices6.push(b6);
             Z_vertices6.push(c6);
             Z_vertices6.push(1);
             Z_vertices6.push(0.9);
             Z_vertices6.push(0.7)
         }
     }
     
    var k1, k2;
    var Z_faces6 = [];
    for (var i = 0; i < stackCount6; ++i) {
        k1 = i * (sectorCount6 + 1);
        k2 = k1 + sectorCount6 + 1;
        for (var j = 0; j < sectorCount6; ++j, ++k1, ++k2) {
            if (i != 0) {
                Z_faces6.push(k1);
                Z_faces6.push(k2);
                Z_faces6.push(k1 + 1);
            }
            if (i != (stackCount6 - 1)) {
                Z_faces6.push(k1 + 1);
                Z_faces6.push(k2);
                Z_faces6.push(k2 + 1);
            }
        }
    }

    // kuping kanan
    var Z_vertices7 = [];
    for (var u = -Math.PI; u <= Math.PI; u+=Math.PI/30) {
        for (var v = -Math.PI/2; v < Math.PI/2; v+=Math.PI/30) {
            // Elliptic paraboloid
            Z_vertices7.push(1.5 * 0.5 * v * Math.cos(u));
            Z_vertices7.push(1.5 * 0.375 * v * Math.sin(u));
            Z_vertices7.push(Math.pow(v, 2));
            
            Z_vertices7.push(1);
            Z_vertices7.push(0.9);
            Z_vertices7.push(0.7);
        }
    }

    var Z_faces7 = [];
    for (var i = 0;i < Z_vertices7.length/6; i++) {
        Z_faces7.push(0);  
        Z_faces7.push(i);  
        Z_faces7.push(i+1);  
    }

     // mata kanan
     var sectorCount8 = 100;
     var stackCount8 = 100;
     var radius8 = 0.1;
 
     var a8, b8, c8, xy8;
     var sectorStep8 = 2 * Math.PI / sectorCount8;
     var stackStep8 = Math.PI / stackCount8;
     var sectorAngle8, stackAngle8;
     var Z_vertices8 = [];
     for (var i = 0; i <= stackCount5; ++i) {
         stackAngle8 = Math.PI / 2 - i * stackStep8;
         xy8 = radius8 * Math.cos(stackAngle8);
         c8 = radius8 * Math.sin(stackAngle8);
         for (var j = 0; j <= sectorCount8; ++j) {
             sectorAngle8 = j * sectorStep8;
             a8 = xy8 * Math.cos(sectorAngle8);
             b8 = xy8 * Math.sin(sectorAngle8);
             Z_vertices8.push(a8);
             Z_vertices8.push(b8);
             Z_vertices8.push(c8);
             Z_vertices8.push(0);
             Z_vertices8.push(0);
             Z_vertices8.push(0);
         }
     }
     
     var k1, k2;
     var Z_faces8 = [];
     for (var i = 0; i < stackCount8; ++i) {
         k1 = i * (sectorCount8 + 1);
         k2 = k1 + sectorCount8 + 1;
         for (var j = 0; j < sectorCount8; ++j, ++k1, ++k2) {
             if (i != 0) {
                 Z_faces8.push(k1);
                 Z_faces8.push(k2);
                 Z_faces8.push(k1 + 1);
             }
             if (i != (stackCount6 - 1)) {
                 Z_faces8.push(k1 + 1);
                 Z_faces8.push(k2);
                 Z_faces8.push(k2 + 1);
             }
         }
     }

     //kepala belakang
    var sectorCount9 = 100;
    var stackCount9 = 100;
    var radius9 = 2;

    var a9, b9, c9, xy9;
    var sectorStep9 = 2 * Math.PI / sectorCount9;
    var stackStep9 = Math.PI / stackCount9;
    var sectorAngle9, stackAngle9;
    var Z_vertices9 = [];
    for (var i = 0; i <= stackCount9; ++i) {
        stackAngle9 = Math.PI / 2 - i * stackStep9;
        xy9 = radius9 * Math.cos(stackAngle9);
        c9 = radius9 * Math.sin(stackAngle9);
        for (var j = 0; j <= sectorCount9; ++j) {
            sectorAngle9 = j * sectorStep9;
            a9 = xy9 * Math.cos(sectorAngle9);
            b9 = xy9 * Math.sin(sectorAngle9);
            Z_vertices9.push(a9);
            Z_vertices9.push(b9);
            Z_vertices9.push(c9);
            Z_vertices9.push(1);
            Z_vertices9.push(0.9);
            Z_vertices9.push(0.7);
        }
    }
    
    var k1, k2;
    var Z_faces9 = [];
    for (var i = 0; i < stackCount9; ++i) {
        k1 = i * (sectorCount9 + 1);
        k2 = k1 + sectorCount9 + 1;
        for (var j = 0; j < sectorCount9; ++j, ++k1, ++k2) {
            if (i != 0) {
                Z_faces9.push(k1);
                Z_faces9.push(k2);
                Z_faces9.push(k1 + 1);
            }
            if (i != (stackCount9 - 1)) {
                Z_faces9.push(k1 + 1);
                Z_faces9.push(k2);
                Z_faces9.push(k2 + 1);
            }
        }
    }

    // badan
    var sectorCount10 = 100;
    var stackCount10 = 100;
    var radius10 = 1.8;

    var a10, b10, c10, xy10;
    var sectorStep9 = 2 * Math.PI / sectorCount10;
    var stackStep10 = Math.PI / stackCount10;
    var sectorAngle10, stackAngle10;
    var Z_vertices10 = [];
    for (var i = 0; i <= stackCount10; ++i) {
        stackAngle10 = Math.PI / 2 - i * stackStep10;
        xy10 = radius10 * Math.cos(stackAngle10);
        c10 = radius10 * Math.sin(stackAngle10);
        for (var j = 0; j <= sectorCount10; ++j) {
            sectorAngle10 = j * sectorStep9;
            a10 = 1.0 * xy10 * Math.cos(sectorAngle10);
            b10 = 1.3 * xy10 * Math.sin(sectorAngle10);
            Z_vertices10.push(a10);
            Z_vertices10.push(b10);
            Z_vertices10.push(c10);
            Z_vertices10.push(1);
            Z_vertices10.push(0.9);
            Z_vertices10.push(0.7);
        }
    }
    
    var k1, k2;
    var Z_faces10 = [];
    for (var i = 0; i < stackCount10; ++i) {
        k1 = i * (sectorCount10 + 1);
        k2 = k1 + sectorCount10 + 1;
        for (var j = 0; j < sectorCount10; ++j, ++k1, ++k2) {
            if (i != 0) {
                Z_faces10.push(k1);
                Z_faces10.push(k2);
                Z_faces10.push(k1 + 1);
            }
            if (i != (stackCount10 - 1)) {
                Z_faces10.push(k1 + 1);
                Z_faces10.push(k2);
                Z_faces10.push(k2 + 1);
            }
        }
    }

    // TANGAN
    var sectorCount11 = 100;
    var stackCount11 = 100;
    var radius11 = 0.6;

    var a11, b11, c11, xy11;
    var sectorStep11 = 2 * Math.PI / sectorCount11;
    var stackStep11 = Math.PI / stackCount11;
    var sectorAngle11, stackAngle11;
    var Z_vertices11 = [];
    for (var i = 0; i <= stackCount11; ++i) {
        stackAngle11 = Math.PI / 2 - i * stackStep11;
        xy11 = radius11 * Math.cos(stackAngle11);
        c11 = radius11 * Math.sin(stackAngle11);
        for (var j = 0; j <= sectorCount11; ++j) {
            sectorAngle11 = j * sectorStep11;
            a11 = xy11 * Math.cos(sectorAngle11);
            b11 = 2.5 * xy11 * Math.sin(sectorAngle11);
            Z_vertices11.push(a11);
            Z_vertices11.push(b11);
            Z_vertices11.push(c11);
            Z_vertices11.push(1);
            Z_vertices11.push(0.9);
            Z_vertices11.push(0.7);
        }
    }
    
    var k1, k2;
    var Z_faces11 = [];
    for (var i = 0; i < stackCount11; ++i) {
        k1 = i * (sectorCount11 + 1);
        k2 = k1 + sectorCount11 + 1;
        for (var j = 0; j < sectorCount11; ++j, ++k1, ++k2) {
            if (i != 0) {
                Z_faces11.push(k1);
                Z_faces11.push(k2);
                Z_faces11.push(k1 + 1);
            }
            if (i != (stackCount11 - 1)) {
                Z_faces11.push(k1 + 1);
                Z_faces11.push(k2);
                Z_faces11.push(k2 + 1);
            }
        }
    }

    // KAKI
    function deg_to_rad(deg){
        return deg*(Math.PI / 180);
    }
    function getX(teta, r){
        return r * Math.cos(teta);
    }
    function getY(teta, r){
        return r * Math.sin(teta);
    }

    var Z_vertices12 = [0,0,0,0,1,1]; //index 0
    //lingkaran e
    for (var i = 1; i <= 360; i++){
        x = getX(deg_to_rad(i), 1) / 2;
        y = getY(deg_to_rad(i), 1) / 2;
        Z_vertices12.push(x);
        Z_vertices12.push(y);
        Z_vertices12.push(0); //z
        Z_vertices12.push(1);
        Z_vertices12.push(0.9);
        Z_vertices12.push(0.7);
    }; //index 1-360
    
    //tengah atas
    Z_vertices12.push(x);
    Z_vertices12.push(y);
    Z_vertices12.push(zTitikPuncak); //z
    Z_vertices12.push(1);
    Z_vertices12.push(0.9);
    Z_vertices12.push(0.7);
    //index 361

    var zTitikPuncak = 1.6;
    //atap e
    for (var i = 1; i <= 360; i++){
        x = 0.8 * getX(deg_to_rad(i), 1) / 2;
        y = getY(deg_to_rad(i), 1) / 2;
        Z_vertices12.push(x);
        Z_vertices12.push(y);
        Z_vertices12.push(zTitikPuncak); //z
        Z_vertices12.push(1);
        Z_vertices12.push(0.9);
        Z_vertices12.push(0.7);
    };//index 362-721

    var Z_faces12 = []; //berlawanan jarum jam kalo bisa dari index 0 -> 1 -> 2
    for (var i = 0; i <= 360; i++){
        Z_faces12.push(0);
        Z_faces12.push(i);
        Z_faces12.push(i+1);
    }
    Z_faces12.push(0);
    Z_faces12.push(1);
    Z_faces12.push(360);
    //tinggi 
    for (var i = 1; i <= 360; i++){
        Z_faces12.push(i);
        Z_faces12.push(i+1);
        Z_faces12.push(i+361);
        
        Z_faces12.push(i+1);
        Z_faces12.push(i+362);
        Z_faces12.push(i+361);
    }
    Z_faces12.push(1);
    Z_faces12.push(360);
    Z_faces12.push(362);
    
    Z_faces12.push(360);
    Z_faces12.push(362);
    Z_faces12.push(721);
    for (var i = 0; i <= 360; i++){
        Z_faces12.push(0+362);
        Z_faces12.push(i+362);
        Z_faces12.push(i+363);
    }

    // TOPI
    var Z_vertices13 = [0,0,0,0,1,1]; //index 0
    //lingkaran e
    for (var i = 1; i <= 360; i++){
        x = getX(deg_to_rad(i), 1) / 2;
        y = getY(deg_to_rad(i), 1) / 2;
        Z_vertices13.push(x);
        Z_vertices13.push(y);
        Z_vertices13.push(0); //z
        Z_vertices13.push(1);
        Z_vertices13.push(0);
        Z_vertices13.push(1);
    }; //index 1-360

    //tengah atas
    Z_vertices13.push(x);
    Z_vertices13.push(y);
    Z_vertices13.push(zTitikPuncak); //z
    Z_vertices13.push(0);
    Z_vertices13.push(0);
    Z_vertices13.push(0);
    //index 361

    var zTitikPuncak = 1.6;
    //atap e
    for (var i = 1; i <= 360; i++){
        // x = getX(deg_to_rad(i), 1) / 2;
        // y = getY(deg_to_rad(i), 1) / 2;
        Z_vertices13.push(x);
        Z_vertices13.push(y);
        Z_vertices13.push(zTitikPuncak); //z
        Z_vertices13.push(1);
        Z_vertices13.push(1);
        Z_vertices13.push(0);
    };//index 362-721

    var Z_faces13 = []; //berlawanan jarum jam kalo bisa dari index 0 -> 1 -> 2
    for (var i = 0; i <= 360; i++){
        Z_faces13.push(0);
        Z_faces13.push(i);
        Z_faces13.push(i+1);
    }
    Z_faces13.push(0);
    Z_faces13.push(1);
    Z_faces13.push(360);
    //tinggi 
    for (var i = 1; i <= 360; i++){
        Z_faces13.push(i);
        Z_faces13.push(i+1);
        Z_faces13.push(i+361);

        Z_faces13.push(i+1);
        Z_faces13.push(i+362);
        Z_faces13.push(i+361);
    }
    Z_faces13.push(1);
    Z_faces13.push(360);
    Z_faces13.push(362);

    Z_faces13.push(360);
    Z_faces13.push(362);
    Z_faces13.push(721);
    for (var i = 0; i <= 360; i++){
        Z_faces13.push(0+362);
        Z_faces13.push(i+362);
        Z_faces13.push(i+363);
    }

    // batang topi
    function deg_to_rad(deg){
        return deg*(Math.PI / 180);
    }
    function getX(teta, r){
        return r * Math.cos(teta);
    }
    function getY(teta, r){
        return r * Math.sin(teta);
    }

    var Z_vertices14 = [0,0,0,0,1,1]; //index 0
    //lingkaran e
    for (var i = 1; i <= 360; i++){
        x = getX(deg_to_rad(i), 1) / 5;
        y = getY(deg_to_rad(i), 1) / 5;
        Z_vertices14.push(x);
        Z_vertices14.push(y);
        Z_vertices14.push(0); //z
        Z_vertices14.push(1);
        Z_vertices14.push(1);
        Z_vertices14.push(1);
    }; //index 1-360
    
    //tengah atas
    Z_vertices14.push(x);
    Z_vertices14.push(y);
    Z_vertices14.push(zTitikPuncak); //z
    Z_vertices14.push(1);
    Z_vertices14.push(1);
    Z_vertices14.push(1);
    //index 361

    var zTitikPuncak = 1.6;
    //atap e
    for (var i = 1; i <= 360; i++){
        x = 0.8 * getX(deg_to_rad(i), 1) / 5;
        y = getY(deg_to_rad(i), 1) / 5;
        Z_vertices14.push(x);
        Z_vertices14.push(y);
        Z_vertices14.push(zTitikPuncak); //z
        Z_vertices14.push(1);
        Z_vertices14.push(1);
        Z_vertices14.push(1);
    };//index 362-721

    var Z_faces14 = []; //berlawanan jarum jam kalo bisa dari index 0 -> 1 -> 2
    for (var i = 0; i <= 360; i++){
        Z_faces14.push(0);
        Z_faces14.push(i);
        Z_faces14.push(i+1);
    }
    Z_faces14.push(0);
    Z_faces14.push(1);
    Z_faces14.push(360);
    //tinggi 
    for (var i = 1; i <= 360; i++){
        Z_faces14.push(i);
        Z_faces14.push(i+1);
        Z_faces14.push(i+361);
        
        Z_faces14.push(i+1);
        Z_faces14.push(i+362);
        Z_faces14.push(i+361);
    }
    Z_faces14.push(1);
    Z_faces14.push(360);
    Z_faces14.push(362);
    
    Z_faces14.push(360);
    Z_faces14.push(362);
    Z_faces14.push(721);
    for (var i = 0; i <= 360; i++){
        Z_faces14.push(0+362);
        Z_faces14.push(i+362);
        Z_faces14.push(i+363);
    }
   
    // OBJECT
    var Z_object1 = new myObject(Z_vertices1, Z_faces1, shader_vertex_source, shader_fragment_source);
    var Z_object2 = new myObject(Z_vertices2, Z_faces2, shader_vertex_source, shader_fragment_source);
    var Z_object3 = new myObject(Z_vertices3, Z_faces3, shader_vertex_source, shader_fragment_source);
    var Z_object4 = new myObject(Z_vertices4, Z_faces4, shader_vertex_source, shader_fragment_source);
    var Z_object5 = new myObject(Z_vertices5, Z_faces5, shader_vertex_source, shader_fragment_source);
    var Z_object6 = new myObject(Z_vertices6, Z_faces6, shader_vertex_source, shader_fragment_source);
    var Z_object7 = new myObject(Z_vertices7, Z_faces7, shader_vertex_source, shader_fragment_source);
    var Z_object8 = new myObject(Z_vertices8, Z_faces8, shader_vertex_source, shader_fragment_source);
    var Z_object9 = new myObject(Z_vertices9, Z_faces9, shader_vertex_source, shader_fragment_source);
    var Z_object10 = new myObject(Z_vertices10, Z_faces10, shader_vertex_source, shader_fragment_source);
    var Z_object11 = new myObject(Z_vertices11, Z_faces11, shader_vertex_source, shader_fragment_source);
    var Z_object12 = new myObject(Z_vertices11, Z_faces11, shader_vertex_source, shader_fragment_source);
    var Z_object13 = new myObject(Z_vertices12, Z_faces12, shader_vertex_source, shader_fragment_source);
    var Z_object14 = new myObject(Z_vertices12, Z_faces12, shader_vertex_source, shader_fragment_source);
    var Z_object15 = new myObject(Z_vertices13, Z_faces13, shader_vertex_source, shader_fragment_source);
    var Z_object16 = new myObject(Z_vertices14, Z_faces14, shader_vertex_source, shader_fragment_source);

    Z_object1.addChild(Z_object2);
    Z_object1.addChild(Z_object3);
    Z_object1.addChild(Z_object4);
    Z_object1.addChild(Z_object5);
    Z_object1.addChild(Z_object6);
    Z_object1.addChild(Z_object7);
    Z_object1.addChild(Z_object8);
    Z_object1.addChild(Z_object9);
    Z_object1.addChild(Z_object10);
    Z_object1.addChild(Z_object11);
    Z_object1.addChild(Z_object12);
    Z_object1.addChild(Z_object13);
    Z_object1.addChild(Z_object14);
    Z_object1.addChild(Z_object15);
    Z_object1.addChild(Z_object16);



    // OBJECT
    var A_object1 = new myObject(A_vertices1, A_faces1, shader_vertex_source, shader_fragment_source); //KEPALA
    var A_object2 = new myObject(A_vertices2, A_faces2, shader_vertex_source, shader_fragment_source); //HIDUNG
    var A_object3 = new myObject(A_vertices3, A_faces3, shader_vertex_source, shader_fragment_source); //MULUT
    var A_object4 = new myObject(A_vertices4, A_faces4, shader_vertex_source, shader_fragment_source); //KUPING KIRI
    var A_object5 = new myObject(A_vertices5, A_faces5, shader_vertex_source, shader_fragment_source); //MATA KIRI
    var A_object6 = new myObject(A_vertices5, A_faces5, shader_vertex_source, shader_fragment_source); //MATA KANAN
    var A_object7 = new myObject(A_vertices4, A_faces4, shader_vertex_source, shader_fragment_source); //KUPING KANAN
    var A_object8 = new myObject(A_vertices6, A_faces6, shader_vertex_source, shader_fragment_source); //BOLA MATA KIRI
    var A_object9 = new myObject(A_vertices6, A_faces6, shader_vertex_source, shader_fragment_source); //BOLA MATA KANAN
    var A_object10 = new myObject(A_vertices7, A_faces7, shader_vertex_source, shader_fragment_source); //LEHER
    var A_object11 = new myObject(A_vertices8, A_faces8, shader_vertex_source, shader_fragment_source); //BADAN
    var A_object12 = new myObject(A_vertices9, A_faces9, shader_vertex_source, shader_fragment_source); //TANGAN KIRI
    var A_object13 = new myObject(A_vertices9, A_faces9, shader_vertex_source, shader_fragment_source); //TANGAN KANAN
    var A_object14 = new myObject(A_vertices10, A_faces10, shader_vertex_source, shader_fragment_source); //KAKI KIRI
    var A_object15 = new myObject(A_vertices10, A_faces10, shader_vertex_source, shader_fragment_source); //KAKI KANAN
    var A_object16 = new myObject(A_vertices11, A_faces11, shader_vertex_source, shader_fragment_source); //TANDUK

    A_object1.addChild(A_object2);
    A_object1.addChild(A_object3);
    A_object1.addChild(A_object4);
    A_object1.addChild(A_object5);
    A_object1.addChild(A_object6);
    A_object1.addChild(A_object7);
    A_object1.addChild(A_object8);
    A_object1.addChild(A_object9);
    A_object1.addChild(A_object10);
    A_object1.addChild(A_object11);
    A_object1.addChild(A_object12);
    A_object1.addChild(A_object13);
    A_object1.addChild(A_object14);
    A_object1.addChild(A_object15);
    A_object1.addChild(A_object16);

    //MATRIX
    var PROJMATRIX = LIBS.get_projection(100, CANVAS.width/CANVAS.height, 1, 100);
    var VIEWMATRIX = LIBS.get_I4();

    LIBS.translateZ(VIEWMATRIX,-10);
    var THETA = 0, PHI = 0;

    /*========================= DRAWING ========================= */
    GL.clearColor(0.0, 0.0, 0.0, 0.0);
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
  
    GL.clearDepth(1.0);
    var time_prev = 0;

    var animate = function(time) {
        var dt = (time-time_prev);
        if (!drag) {
          dX *= AMORTIZATION, dY *= AMORTIZATION;
          THETA += dX, PHI += dY;
        }

	// pala bawa
        Z_object1.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(Z_object1.MOVEMATRIX,Z_object1.MOVEMATRIX,LIBS.degToRad(time * 0.05));

        // hidung
        Z_object2.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(Z_object2.MOVEMATRIX,Z_object2.MOVEMATRIX,LIBS.degToRad(time * 0.05));

        // mulut
        Z_object3.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(Z_object3.MOVEMATRIX,Z_object3.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(Z_object3.MOVEMATRIX,Z_object3.MOVEMATRIX,[0.0,0.0,-0.2])

        // kuping kiri
        Z_object4.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(Z_object4.MOVEMATRIX,Z_object4.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(Z_object4.MOVEMATRIX,Z_object4.MOVEMATRIX,[6.0,-0.6,0.5])
        glMatrix.mat4.rotateX(Z_object4.MOVEMATRIX,Z_object4.MOVEMATRIX,LIBS.degToRad(90));
        glMatrix.mat4.rotateY(Z_object4.MOVEMATRIX,Z_object4.MOVEMATRIX,LIBS.degToRad(137));
        glMatrix.mat4.rotateZ(Z_object4.MOVEMATRIX,Z_object4.MOVEMATRIX,LIBS.degToRad(10));
        
        // mata kiri
        Z_object5.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(Z_object5.MOVEMATRIX,Z_object5.MOVEMATRIX,LIBS.degToRad(time * 0.05));

        // pala ats
        Z_object6.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(Z_object6.MOVEMATRIX,Z_object6.MOVEMATRIX,LIBS.degToRad(time * 0.05));

        //kuping kanan
        Z_object7.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(Z_object7.MOVEMATRIX,Z_object7.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(Z_object7.MOVEMATRIX,Z_object7.MOVEMATRIX,[10.0,-0.6,0.5])
        glMatrix.mat4.rotateX(Z_object7.MOVEMATRIX,Z_object7.MOVEMATRIX,LIBS.degToRad(90));
        glMatrix.mat4.rotateY(Z_object7.MOVEMATRIX,Z_object7.MOVEMATRIX,LIBS.degToRad(-139));
        glMatrix.mat4.rotateZ(Z_object7.MOVEMATRIX,Z_object7.MOVEMATRIX,LIBS.degToRad(10));

        // mata kanan
        Z_object8.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(Z_object8.MOVEMATRIX,Z_object8.MOVEMATRIX,LIBS.degToRad(time * 0.05));

        // pala blkng
        Z_object9.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(Z_object9.MOVEMATRIX,Z_object9.MOVEMATRIX,LIBS.degToRad(time * 0.05));

        // badan
        Z_object10.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(Z_object10.MOVEMATRIX,Z_object10.MOVEMATRIX,LIBS.degToRad(time * 0.05));

        // tangan kanan
        Z_object11.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(Z_object11.MOVEMATRIX,Z_object11.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(Z_object11.MOVEMATRIX,Z_object11.MOVEMATRIX,[6.6,-3.0,0.0])
        glMatrix.mat4.rotateX(Z_object11.MOVEMATRIX,Z_object11.MOVEMATRIX,LIBS.degToRad(150));
        glMatrix.mat4.rotateZ(Z_object11.MOVEMATRIX,Z_object11.MOVEMATRIX,LIBS.degToRad(40));
        glMatrix.mat4.rotateY(Z_object11.MOVEMATRIX,Z_object11.MOVEMATRIX,LIBS.degToRad(0));

        // tangan kiri
        Z_object12.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(Z_object12.MOVEMATRIX,Z_object12.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(Z_object12.MOVEMATRIX,Z_object12.MOVEMATRIX,[9.4,-3.0,0.0])
        glMatrix.mat4.rotateX(Z_object12.MOVEMATRIX,Z_object12.MOVEMATRIX,LIBS.degToRad(150));
        glMatrix.mat4.rotateZ(Z_object12.MOVEMATRIX,Z_object12.MOVEMATRIX,LIBS.degToRad(-49));
        glMatrix.mat4.rotateY(Z_object12.MOVEMATRIX,Z_object12.MOVEMATRIX,LIBS.degToRad(0));

        // KAKI KIRI
        Z_object13.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(Z_object13.MOVEMATRIX,Z_object13.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(Z_object13.MOVEMATRIX,Z_object13.MOVEMATRIX,[7.5,-4.7,0.0])
        glMatrix.mat4.rotateX(Z_object13.MOVEMATRIX,Z_object13.MOVEMATRIX,LIBS.degToRad(90));
        glMatrix.mat4.rotateZ(Z_object13.MOVEMATRIX,Z_object13.MOVEMATRIX,LIBS.degToRad(0));
        glMatrix.mat4.rotateY(Z_object13.MOVEMATRIX,Z_object13.MOVEMATRIX,LIBS.degToRad(0));

        // KAKI KANAN
        Z_object14.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(Z_object14.MOVEMATRIX,Z_object14.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(Z_object14.MOVEMATRIX,Z_object14.MOVEMATRIX,[8.85,-4.7,0.0])
        glMatrix.mat4.rotateX(Z_object14.MOVEMATRIX,Z_object14.MOVEMATRIX,LIBS.degToRad(90));
        glMatrix.mat4.rotateZ(Z_object14.MOVEMATRIX,Z_object14.MOVEMATRIX,LIBS.degToRad(0));
        glMatrix.mat4.rotateY(Z_object14.MOVEMATRIX,Z_object14.MOVEMATRIX,LIBS.degToRad(0));

        // topi
        Z_object15.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(Z_object15.MOVEMATRIX,Z_object15.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(Z_object15.MOVEMATRIX,Z_object15.MOVEMATRIX,[11.0,-3.0,0.0])
        glMatrix.mat4.rotateX(Z_object15.MOVEMATRIX,Z_object15.MOVEMATRIX,LIBS.degToRad(-100));
        glMatrix.mat4.rotateZ(Z_object15.MOVEMATRIX,Z_object15.MOVEMATRIX,LIBS.degToRad(-30));
        glMatrix.mat4.rotateY(Z_object15.MOVEMATRIX,Z_object15.MOVEMATRIX,LIBS.degToRad(20));

        // batang topi
        Z_object16.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(Z_object16.MOVEMATRIX,Z_object16.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(Z_object16.MOVEMATRIX,Z_object16.MOVEMATRIX,[10.0,-4.0,0.0])
        glMatrix.mat4.rotateX(Z_object16.MOVEMATRIX,Z_object16.MOVEMATRIX,LIBS.degToRad(-60));
        glMatrix.mat4.rotateZ(Z_object16.MOVEMATRIX,Z_object16.MOVEMATRIX,LIBS.degToRad(30));
        glMatrix.mat4.rotateY(Z_object16.MOVEMATRIX,Z_object16.MOVEMATRIX,LIBS.degToRad(50));


        glMatrix.mat4.translate(Z_object1.MOVEMATRIX,Z_object1.MOVEMATRIX,[8.0,0.0,0.0])
        glMatrix.mat4.translate(Z_object2.MOVEMATRIX,Z_object2.MOVEMATRIX,[8.0,0.2,2.0])
        glMatrix.mat4.translate(Z_object3.MOVEMATRIX,Z_object3.MOVEMATRIX,[8.0,-0.4,0.8])
        glMatrix.mat4.translate(Z_object5.MOVEMATRIX,Z_object5.MOVEMATRIX,[7.6,1.5,1.4])
        glMatrix.mat4.translate(Z_object6.MOVEMATRIX,Z_object6.MOVEMATRIX,[8.0,0.9,-0.5])
        glMatrix.mat4.translate(Z_object8.MOVEMATRIX,Z_object8.MOVEMATRIX,[8.4,1.5,1.4])
        glMatrix.mat4.translate(Z_object9.MOVEMATRIX,Z_object9.MOVEMATRIX,[8.0,0.0,-0.5])
        glMatrix.mat4.translate(Z_object10.MOVEMATRIX,Z_object10.MOVEMATRIX,[8.0,-3.7,0.0])

        // KEPALA
        A_object1.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(A_object1.MOVEMATRIX,A_object1.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(A_object1.MOVEMATRIX,A_object1.MOVEMATRIX,[0.0,0.0,0.0])

        // HIDUNG
        A_object2.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(A_object2.MOVEMATRIX,A_object2.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(A_object2.MOVEMATRIX,A_object2.MOVEMATRIX,[0.0,0.2,2.0])

        // MULUT
        A_object3.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(A_object3.MOVEMATRIX,A_object3.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(A_object3.MOVEMATRIX,A_object3.MOVEMATRIX,[0.0,-0.4,0.8])

        // KUPING KIRI
        A_object4.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(A_object4.MOVEMATRIX,A_object4.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(A_object4.MOVEMATRIX,A_object4.MOVEMATRIX,[-2.0,2.0,0.2])
        glMatrix.mat4.rotateX(A_object4.MOVEMATRIX,A_object4.MOVEMATRIX,LIBS.degToRad(80));
        glMatrix.mat4.rotateY(A_object4.MOVEMATRIX,A_object4.MOVEMATRIX,LIBS.degToRad(40));
        glMatrix.mat4.rotateZ(A_object4.MOVEMATRIX,A_object4.MOVEMATRIX,LIBS.degToRad(50));
        
        // MATA KIRI
        A_object5.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(A_object5.MOVEMATRIX,A_object5.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(A_object5.MOVEMATRIX,A_object5.MOVEMATRIX,[-0.2,-0.0,0.3])
        glMatrix.mat4.rotateX(A_object5.MOVEMATRIX,A_object5.MOVEMATRIX,LIBS.degToRad(70));
        glMatrix.mat4.rotateZ(A_object5.MOVEMATRIX,A_object5.MOVEMATRIX,LIBS.degToRad(130));
        glMatrix.mat4.rotateY(A_object5.MOVEMATRIX,A_object5.MOVEMATRIX,LIBS.degToRad(30));
        
        // MATA KANAN
        A_object6.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(A_object6.MOVEMATRIX,A_object6.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(A_object6.MOVEMATRIX,A_object6.MOVEMATRIX,[0.2,-0.05,0.3])
        glMatrix.mat4.rotateX(A_object6.MOVEMATRIX,A_object6.MOVEMATRIX,LIBS.degToRad(70));
        glMatrix.mat4.rotateZ(A_object6.MOVEMATRIX,A_object6.MOVEMATRIX,LIBS.degToRad(-130));
        glMatrix.mat4.rotateY(A_object6.MOVEMATRIX,A_object6.MOVEMATRIX,LIBS.degToRad(-30));

        // KUPING KANAN
        A_object7.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(A_object7.MOVEMATRIX,A_object7.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(A_object7.MOVEMATRIX,A_object7.MOVEMATRIX,[2.0,2.0,0.2])
        glMatrix.mat4.rotateX(A_object7.MOVEMATRIX,A_object7.MOVEMATRIX,LIBS.degToRad(80));
        glMatrix.mat4.rotateY(A_object7.MOVEMATRIX,A_object7.MOVEMATRIX,LIBS.degToRad(-40));
        glMatrix.mat4.rotateZ(A_object7.MOVEMATRIX,A_object7.MOVEMATRIX,LIBS.degToRad(50));
        
        // BOLA MATA KIRI
        A_object8.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(A_object8.MOVEMATRIX,A_object8.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(A_object8.MOVEMATRIX,A_object8.MOVEMATRIX,[-0.8,1.45,1.3])

        // BOLA MATA KANAN
        A_object9.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(A_object9.MOVEMATRIX,A_object9.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(A_object9.MOVEMATRIX,A_object9.MOVEMATRIX,[0.8,1.4,1.3])

        // LEHER
        A_object10.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(A_object10.MOVEMATRIX,A_object10.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(A_object10.MOVEMATRIX,A_object10.MOVEMATRIX,[0.0,-1.3,0.0])
        glMatrix.mat4.rotateX(A_object10.MOVEMATRIX,A_object10.MOVEMATRIX,LIBS.degToRad(0));
        glMatrix.mat4.rotateY(A_object10.MOVEMATRIX,A_object10.MOVEMATRIX,LIBS.degToRad(0));
        glMatrix.mat4.rotateZ(A_object10.MOVEMATRIX,A_object10.MOVEMATRIX,LIBS.degToRad(90));

        // BADAN
        A_object11.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(A_object11.MOVEMATRIX,A_object11.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(A_object11.MOVEMATRIX,A_object11.MOVEMATRIX,[0.0,-3.7,0.0])
        
        // TANGAN KIRI
        A_object12.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(A_object12.MOVEMATRIX,A_object12.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(A_object12.MOVEMATRIX,A_object12.MOVEMATRIX,[-1.4,-3.0,0.0])
        glMatrix.mat4.rotateX(A_object12.MOVEMATRIX,A_object12.MOVEMATRIX,LIBS.degToRad(150));
        glMatrix.mat4.rotateZ(A_object12.MOVEMATRIX,A_object12.MOVEMATRIX,LIBS.degToRad(40));
        glMatrix.mat4.rotateY(A_object12.MOVEMATRIX,A_object12.MOVEMATRIX,LIBS.degToRad(0));

        // TANGAN KANAN
        A_object13.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(A_object13.MOVEMATRIX,A_object13.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(A_object13.MOVEMATRIX,A_object13.MOVEMATRIX,[1.4,-3.0,0.0])
        glMatrix.mat4.rotateX(A_object13.MOVEMATRIX,A_object13.MOVEMATRIX,LIBS.degToRad(0));
        glMatrix.mat4.rotateZ(A_object13.MOVEMATRIX,A_object13.MOVEMATRIX,LIBS.degToRad(40));
        glMatrix.mat4.rotateY(A_object13.MOVEMATRIX,A_object13.MOVEMATRIX,LIBS.degToRad(0));

        // KAKI KIRI
        A_object14.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(A_object14.MOVEMATRIX,A_object14.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(A_object14.MOVEMATRIX,A_object14.MOVEMATRIX,[-0.85,-4.7,0.0])
        glMatrix.mat4.rotateX(A_object14.MOVEMATRIX,A_object14.MOVEMATRIX,LIBS.degToRad(60));
        glMatrix.mat4.rotateZ(A_object14.MOVEMATRIX,A_object14.MOVEMATRIX,LIBS.degToRad(0));
        glMatrix.mat4.rotateY(A_object14.MOVEMATRIX,A_object14.MOVEMATRIX,LIBS.degToRad(0));

        // KAKI KANAN
        A_object15.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(A_object15.MOVEMATRIX,A_object15.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(A_object15.MOVEMATRIX,A_object15.MOVEMATRIX,[0.85,-4.7,0.0])
        glMatrix.mat4.rotateX(A_object15.MOVEMATRIX,A_object15.MOVEMATRIX,LIBS.degToRad(120));
        glMatrix.mat4.rotateZ(A_object15.MOVEMATRIX,A_object15.MOVEMATRIX,LIBS.degToRad(0));
        glMatrix.mat4.rotateY(A_object15.MOVEMATRIX,A_object15.MOVEMATRIX,LIBS.degToRad(0));

        // TANDUK
        A_object16.MOVEMATRIX = glMatrix.mat4.create();
        glMatrix.mat4.rotateY(A_object16.MOVEMATRIX,A_object16.MOVEMATRIX,LIBS.degToRad(time * 0.05));
        glMatrix.mat4.translate(A_object16.MOVEMATRIX,A_object16.MOVEMATRIX,[0.0,-1.9,0.95])
        glMatrix.mat4.rotateX(A_object16.MOVEMATRIX,A_object16.MOVEMATRIX,LIBS.degToRad(0));
        glMatrix.mat4.rotateZ(A_object16.MOVEMATRIX,A_object16.MOVEMATRIX,LIBS.degToRad(0));
        glMatrix.mat4.rotateY(A_object16.MOVEMATRIX,A_object16.MOVEMATRIX,LIBS.degToRad(0));

        time_prev = time;

        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT| GL.D_BUFFER_BIT);

	 Z_object1.setUniform4(PROJMATRIX,VIEWMATRIX);
        Z_object1.child[0].setUniform4(PROJMATRIX,VIEWMATRIX);
        Z_object1.child[1].setUniform4(PROJMATRIX,VIEWMATRIX);
        Z_object1.child[2].setUniform4(PROJMATRIX,VIEWMATRIX);
        Z_object1.child[3].setUniform4(PROJMATRIX,VIEWMATRIX);
        Z_object1.child[4].setUniform4(PROJMATRIX,VIEWMATRIX);
        Z_object1.child[5].setUniform4(PROJMATRIX,VIEWMATRIX);
        Z_object1.child[6].setUniform4(PROJMATRIX,VIEWMATRIX);
        Z_object1.child[7].setUniform4(PROJMATRIX,VIEWMATRIX);
        Z_object1.child[8].setUniform4(PROJMATRIX,VIEWMATRIX);
        Z_object1.child[9].setUniform4(PROJMATRIX,VIEWMATRIX);
        Z_object1.child[10].setUniform4(PROJMATRIX,VIEWMATRIX);
        Z_object1.child[11].setUniform4(PROJMATRIX,VIEWMATRIX);
        Z_object1.child[12].setUniform4(PROJMATRIX,VIEWMATRIX);
        Z_object1.child[13].setUniform4(PROJMATRIX,VIEWMATRIX);
        Z_object1.child[14].setUniform4(PROJMATRIX,VIEWMATRIX);
        
        Z_object1.draw();

        
        A_object1.setUniform4(PROJMATRIX,VIEWMATRIX);
        A_object1.child[0].setUniform4(PROJMATRIX,VIEWMATRIX);
        A_object1.child[1].setUniform4(PROJMATRIX,VIEWMATRIX);
        A_object1.child[2].setUniform4(PROJMATRIX,VIEWMATRIX);
        A_object1.child[3].setUniform4(PROJMATRIX,VIEWMATRIX);
        A_object1.child[4].setUniform4(PROJMATRIX,VIEWMATRIX);
        A_object1.child[5].setUniform4(PROJMATRIX,VIEWMATRIX);
        A_object1.child[6].setUniform4(PROJMATRIX,VIEWMATRIX);
        A_object1.child[7].setUniform4(PROJMATRIX,VIEWMATRIX);
        A_object1.child[8].setUniform4(PROJMATRIX,VIEWMATRIX);
        A_object1.child[9].setUniform4(PROJMATRIX,VIEWMATRIX);
        A_object1.child[10].setUniform4(PROJMATRIX,VIEWMATRIX);
        A_object1.child[11].setUniform4(PROJMATRIX,VIEWMATRIX);
        A_object1.child[12].setUniform4(PROJMATRIX,VIEWMATRIX);
        A_object1.child[13].setUniform4(PROJMATRIX,VIEWMATRIX);
        A_object1.child[14].setUniform4(PROJMATRIX,VIEWMATRIX);

        A_object1.draw();

        GL.flush();

        window.requestAnimationFrame(animate);
    };

    animate(0);
}
window.addEventListener('load',main);

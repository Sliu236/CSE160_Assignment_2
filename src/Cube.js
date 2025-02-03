/*[student's name: Size Liu]
[sliu236@ucsc.edu 1852375]

Notes to Grader:
[N/A]*/

class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];  // 默认白色
        this.matrix = new Matrix4();       // 局部变换矩阵
    }

    render() {
        var rgba = this.color;
        // 上传当前颜色和局部变换矩阵
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // 定义立方体 8 个顶点（单位立方体，位于[0,1]范围内）
        // v0 = (0,0,0), v1 = (1,0,0), v2 = (1,1,0), v3 = (0,1,0)
        // v4 = (0,0,1), v5 = (1,0,1), v6 = (1,1,1), v7 = (0,1,1)
        
        // Front face (z = 0): 使用 v0, v1, v2, v3
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawTriangle3D([0, 0, 0,   1, 0, 0,   1, 1, 0]);
        drawTriangle3D([0, 0, 0,   1, 1, 0,   0, 1, 0]);
        
        // Back face (z = 1): 使用 v5, v4, v7, v6
        gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);
        drawTriangle3D([1, 0, 1,   0, 0, 1,   0, 1, 1]);
        drawTriangle3D([1, 0, 1,   0, 1, 1,   1, 1, 1]);
        
        // Left face (x = 0): 使用 v4, v0, v3, v7
        gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);
        drawTriangle3D([0, 0, 1,   0, 0, 0,   0, 1, 0]);
        drawTriangle3D([0, 0, 1,   0, 1, 0,   0, 1, 1]);
        
        // Right face (x = 1): 使用 v1, v5, v6, v2
        gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);
        drawTriangle3D([1, 0, 0,   1, 0, 1,   1, 1, 1]);
        drawTriangle3D([1, 0, 0,   1, 1, 1,   1, 1, 0]);
        
        // Top face (y = 1): 使用 v3, v2, v6, v7
        gl.uniform4f(u_FragColor, rgba[0] * 0.7, rgba[1] * 0.7, rgba[2] * 0.7, rgba[3]);
        drawTriangle3D([0, 1, 0,   1, 1, 0,   1, 1, 1]);
        drawTriangle3D([0, 1, 0,   1, 1, 1,   0, 1, 1]);
        
        // Bottom face (y = 0): 使用 v4, v5, v1, v0
        gl.uniform4f(u_FragColor, rgba[0] * 0.7, rgba[1] * 0.7, rgba[2] * 0.7, rgba[3]);
        drawTriangle3D([0, 0, 1,   1, 0, 1,   1, 0, 0]);
        drawTriangle3D([0, 0, 1,   1, 0, 0,   0, 0, 0]);
        
        // 可选：恢复为原始颜色
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    }
}

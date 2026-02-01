import { useEffect, useRef } from 'react';

export const MatrixRain = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Matrix characters (Katakana + Latin + Numbers)
        const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
        const charArray = chars.split('');
        
        const fontSize = 14;
        const columns = Math.floor(canvas.width / fontSize);
        
        // Array to track y position of each column
        const drops = Array(columns).fill(1);
        
        const draw = () => {
            // Semi-transparent black to create trail effect
            ctx.fillStyle = 'rgba(2, 2, 2, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#00FF41';
            ctx.font = `${fontSize}px JetBrains Mono, monospace`;
            
            for (let i = 0; i < drops.length; i++) {
                // Random character
                const char = charArray[Math.floor(Math.random() * charArray.length)];
                
                // Draw character
                const x = i * fontSize;
                const y = drops[i] * fontSize;
                
                // Brighter character at the head
                if (Math.random() > 0.9) {
                    ctx.fillStyle = '#FFFFFF';
                } else {
                    ctx.fillStyle = '#00FF41';
                }
                
                ctx.fillText(char, x, y);
                
                // Reset drop randomly or when it reaches bottom
                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                
                drops[i]++;
            }
        };
        
        const interval = setInterval(draw, 50);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="matrix-rain-canvas"
            data-testid="matrix-rain-canvas"
        />
    );
};

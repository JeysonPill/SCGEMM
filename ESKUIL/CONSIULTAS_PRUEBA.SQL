SELECT 
USUARIOS.ID_USR,
USUARIOS.PASS,
USUARIOS_DETAIL.NOMBRE,
USUARIOS.ROLEE
FROM USUARIOS 
JOIN USUARIOS_DETAIL ON USUARIOS.ID_USR=USUARIOS_DETAIL.ID_USR 
WHERE USUARIOS.ID_USR = 'USUARIO001' ;



SELECT * FROM USUARIOS WHERE user_name = ?
        user_id: user.id_user,
        user_name: user.user_name,
        user_role: user.user_role,
        user_matricula: user.id_user
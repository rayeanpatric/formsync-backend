@echo off
echo Installing bcrypt dependency...
npm install bcrypt@^5.1.0

echo Resetting database with hashed passwords...
npm run prisma:reset

echo Password hashing implementation complete!
echo All demo account passwords are now securely hashed using bcrypt with salt rounds: 12
echo.
echo Demo accounts remain the same:
echo - Admin: admin@example.com / admin123
echo - Users: john@example.com / password123
echo          jane@example.com / password123
echo          alice@example.com / password123
pause

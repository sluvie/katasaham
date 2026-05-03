Cara Menjalankan:
Langkah 1: Perbaiki Izin Tabel (Sekali saja) Jalankan perintah ini di terminal (Anda mungkin akan diminta password superuser postgres):

psql -h localhost -p 5499 -U postgres -d katasaham -f db/migration/fix_permissions.sql

Langkah 2: Jalankan Script Migrasi Setelah izin diperbaiki, jalankan script migrasinya:

node db/migration/migrate_emiten.js

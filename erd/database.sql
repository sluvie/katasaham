create user katasaham with password 'katasaham';
alter role katasaham createdb;
create database katasahamdb with owner=katasaham;
grant all privileges on database katasahamdb to katasaham;

psql postgres -U katasaham
\c katasahamdb katasaham
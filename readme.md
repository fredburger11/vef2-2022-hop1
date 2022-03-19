# Hópverkefni 1 
* Kári Viðar Jónsson: fredburger11
* Rúnar Unnsteinsson: runar-u

Til þess að keyra verkefni:
* npm install
* npm run setup
* npm run start

Admin aðgangur:
* Username: `admin`
* Password: `admin`


Dæmi um curl

POST:
> curl -vH "Content-Type: application/json" -d
'{
    "name":"Kari",
    "username":"KariKlariSmari",
    "password":"hundurhestursvin"
}'
http://localhost:3000/users/register/

POST:
> curl -vH "Content-Type: application/json" -d
'{
    "username":"KariKlariSmari",
    "password":"hundurhestursvin"
}'
http://localhost:3000/users/login/

curl --location --request GET 'http://localhost:3000/users/me/'  
curl --location --request GET 'http://localhost:3000/'  
curl --location --request GET 'http://localhost:3000/menu'  
curl --location --request GET 'http://localhost:3000/menu?category=1'  
curl --location --request GET 'http://localhost:3000/menu?search=humar'  

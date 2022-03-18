Hópverkefni 1 Jón Karl, Kári og Rúnar

Byggist mikið á h1-sýnilausn frá 2021

Grunnur að /menu webservice kominn. vantar að gera validator-a.

Virkni til að búa til töflur og setja inn gögn í setup.js komin

Admin aðgangur:
* Username: `admin`
* Password: `admin`

Skipanir til þess að búa til gagnagrunn og notanda fyrir verkefnið (þarf að logga sig inn sem superuser fyrst):
```
create database "vef2-2022-hop1";
create user vef2_h1 with password 'vef2_h1';
grant all on database "vef2-2022-hop1" to vef2_h1;
```

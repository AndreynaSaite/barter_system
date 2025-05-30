## локальная разработка
- переименуйте .example.env - > env в 2х местах в корне и папке barter_system
- docker compose up -d db
- cd barter_system
- pip install -r requirements.txt
- python manage.py makemigrations
- python manage.py migrate
- python manage.py runserver


## Тесты 
- pytest

редактирование свои картачек при нажатии на них доступно в разделе
мои обьявления и в разделе все обьявления, предложение обмена 
доступно при нажатии на карточку в разделе все обьявления 

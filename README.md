# roulette-simulator
Web based roulette simulator, featuring:
- hash based rounds
- accounts with steam login
- chat

Live version: http://sebafudi.tech/ <br />

# Short description
This is an really old project. It looks pretty nice, and all above features works.<br />
Code inside through is pretty bad, and doesn't follow any rules nor esthetic values.<br />

# How it works
When app starts, it generates set number of hashes and stores them in mongodb databse. Each hash is based on previous one. Then it iterates throught all of them in reverse order, so it's nearly impossible to guess next number, but extreamly easy to check if previous hash was legit, and not altered in any way.<br />

# How you can test it
Red button will bet 0.55 USD (or 55 points) on red, and if you have some luck, you'll double your bet. <br />
Green button will reset your balance to 0. <br />
Black button will add 0.55 USD to your account. <br />

# The code is pretty bad and unfinished
When betting it doesn't even check if your balance is above zero, but if your balance ever reach that, it'll show CONTACT SUPPORT instead of your balance. <br />
All the secret codes are even in the code itself ¯\\_(ツ)_/¯
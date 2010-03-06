ZIP=zip -r -9
MV=mv
VERSION=0.8.1

NAME=trombinews-$(VERSION)

all: $(NAME).xpi

$(NAME).xpi: src/chrome/trombinews.jar
	cd src ; $(ZIP) $(NAME).zip chrome.manifest install.rdf readme-$(VERSION).txt  chrome/trombinews.jar
	$(MV) src/$(NAME).zip $(NAME).xpi

src/chrome/trombinews.jar:
	cd src/chrome/trombinews ; $(ZIP) trombinews.zip content
	$(MV) src/chrome/trombinews/trombinews.zip src/chrome/trombinews.jar

test:
	pwd
	cd .. ; pwd
	pwd

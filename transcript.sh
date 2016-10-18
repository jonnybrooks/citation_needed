say -o "001-title" "citation needed" &
say -o "002-intro" "Welcome to citation needed, the game of infinite expression and low effort comedy." &
say -o "003-round1-intro" "I know you're all itching to start, so lets get right into the first round." &
say -o "004-round1-desc" "In round one, a sentence will appear on the screen. This sentence has been selected from a wikipedia article at random" &
say -o "005-round1-desc" "and all you have to do is guess which article you think its from." &
say -o "006-round1-desc" "When everyone has submitted their answers, the correct answer will appear on the screen - but it will be buried amongst all the other answers submitted by your opponents." &
say -o "007-round1-desc" "This is when you must vote for which article you believe the sentence truly came from." &
say -o "008-round1-desc" "But the best part is, not only do you score points for guessing the answer correctly, but also when people vote for yours." &
say -o "009-round1-desc" "So be as deceptive and as convincing as you can. Okay. Are you ready for the question? Here it comes."  &
say -o "010-round1-end" "Okay, everyone has submitted their answers. Time to vote for which answer you think is the truth."  &
say -o "011-round1-timeout" "Time is up. That's too bad. Time to vote for which answer you think is the truth."  &&
for f in *.aiff; do lame -V 1 "$f" "public/speech/${f%.aiff}.mp3"; done &&
find . -type f -iname \*.aiff -delete
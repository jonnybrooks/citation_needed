say -o "citation-needed" "citation needed" &
say -o "welcome" "Welcome to citation needed, the game of infinite expression and low effort comedy." &
say -o "pre-round1" "I know you're all itching to start, so lets get right into the first round." &
say -o "guess-the-article-desc-1" "In round one, a sentence will appear on the screen. This sentence has been selected from a wikipedia article at random" &
say -o "guess-the-article-desc-2" "and all you have to do is guess which article you think its from." &
say -o "guess-the-article-desc-3" "When everyone has submitted their answers, the correct answer will appear on the screen - but it will be buried amongst all the other answers submitted by your opponents." &
say -o "guess-the-article-desc-4" "This is when you must vote for which article you believe the sentence truly came from." &
say -o "guess-the-article-desc-5" "But the best part is, not only do you score points for guessing the answer correctly, but also when people vote for yours." &
say -o "guess-the-article-desc-6" "So be as deceptive and as convincing as you can. Okay. Are you ready for the question? Here it comes."  &
say -o "guess-the-article-end" "Okay, everyone has submitted their answers. Time to vote for which answer you think is the truth."  &
say -o "guess-the-article-timeout" "Time is up. That's too bad. Time to vote for which answer you think is the truth."  &&
for f in *.aiff; do lame -V 1 "$f" "public/speech/${f%.aiff}.mp3"; done &&
find . -type f -iname \*.aiff -delete
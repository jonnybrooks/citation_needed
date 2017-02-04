say -o "citation-needed" "citation needed" &
say -o "welcome" "Welcome to citation needed, the game of infinite expression and low effort comedy." &
say -o "pre-round1" "I know you're all itching to start, so lets get right into the first round." &
say -o "pre-round2" "Time for the second round. I hope you're as ready as I am."  &
say -o "pre-round3" "Okay, we're onto the last round now. How exciting."  &
say -o "guessed-appearance-desc-1" "In this round, a sentence will appear on the screen. This sentence has been selected from a wikipedia article at random" &
say -o "guessed-appearance-desc-2" "and all you have to do is guess which article you think its from." &
say -o "guessed-appearance-desc-3" "When everyone has submitted their answers, the correct answer will appear on the screen - but it will be buried amongst all the other answers submitted by your opponents." &
say -o "guessed-appearance-desc-4" "This is when you must vote for which article you believe the sentence truly came from." &
say -o "guessed-appearance-desc-5" "But the best part is, not only do you score points for guessing the answer correctly, but also when people vote for yours." &
say -o "guessed-appearance-desc-6" "So be as deceptive and as convincing as you can. Okay. Are you ready for the question? Here it comes."  &
say -o "guessed-appearance-end" "Okay, everyone has submitted their answers. Time to vote for which answer you think is the truth."  &
say -o "guessed-appearance-timeout" "Time is up. Cry me a river. Time to vote for which answer you think is the truth."  &
say -o "excerpt-opinions-desc-1" "In excerpt opinions, the title of a wikipedia article chosen at random will appear on your smartphones."  &
say -o "excerpt-opinions-desc-2" "Then it's your job to answer with a snippet of text that could have come from the aforementioned article."  &
say -o "excerpt-opinions-desc-3" "The answer should by no means be serious - wikipedia articles are edited to say stupid stuff all the time, you know."  &
say -o "excerpt-opinions-desc-4" "When everyone has submitted their answers, the two people who provided a snippet for this title will compete for your votes."  &
say -o "excerpt-opinions-desc-5" "So vote for whomevers snippet is the most ridiculous, witty or stupid - this round isn't about being right."  &
say -o "excerpt-opinions-desc-6" "And don't forget to submit a snippet for both titles! Or you'll miss out on some juicy points. Are you ready? Set? Go!"  &
say -o "excerpt-opinions-end" "Looks like everyone finished in time. Good job! Time to vote."  &
say -o "excerpt-opinions-timeout" "Yikes, looks like some of you missed out. l o l. Onto the votes."  &
say -o "you-complete-me-desc-1" "In you complete me, you'll receive an incomplete snippet from a random Wikipedia article."  &
say -o "you-complete-me-desc-2" "Then, wherever you see a blank, you have to fill it with a funny phrase you think fits."  &
say -o "you-complete-me-desc-3" "If you don't know how this works by now, just ask jonny."  &
say -o "you-complete-me-desc-4" "Then comes the answers."  &
say -o "you-complete-me-desc-5" "Then the voting."  &
say -o "you-complete-me-desc-6" "You get the picture. Remember to answer both. Time for the last round, don't be nervous. ha ha ha."  &
say -o "you-complete-me-end" "You did great. I am overwhelmed with happiness for you. Voting time!"  &
say -o "you-complete-me-timeout" "That big thing in the top right corner is the timer, in case you had forgotten. Time for the votes"  &&
for f in *.aiff; do ffmpeg -i "$f" "${f%.aiff}.mp3" && mv "${f%.aiff}.mp3" "public/audio/speech/" ; done &&
find . -type f -iname \*.aiff -delete
// Field Notes content. Dispatches are current; the archive holds six early pieces
// first posted on bloggingboy.home.blog (2019–2020), re-cased from all-caps and
// otherwise left as written. Stanzas are separated by blank lines.

export interface Dispatch {
  date: string; // ISO
  title: string;
  body: string[];
}

export interface ArchivePiece {
  slug: string;
  date: string; // ISO
  title: string;
  kind: "Verse" | "Essay";
  lede?: string;
  text: string;
  coda?: string;
}

export const DISPATCHES: Dispatch[] = [
  {
    date: "2026-11-25",
    title: "The book has a name",
    body: [
      "For seven months I called it The Pages Between Us. The working title stays on the manuscript folder; the cover now says The Bookshop at Fujinomachi.",
      "The bookshop was always the centre. Hana's grandmother's shelves, the register, the curtain drawn at closing. The title should have said so from the start.",
    ],
  },
  {
    date: "2026-11-18",
    title: "Chapter 01 is locked",
    body: [
      "Aru steps off the train at Fujinomachi Station on a Sunday afternoon in November, a suitcase his Ma packed too full and a phone full of messages he hasn't answered.",
      "The chapter is finished and open to read in the Fujinomachi room. Chapter 02 belongs to Hana.",
    ],
  },
];

export const ARCHIVE: ArchivePiece[] = [
  {
    slug: "she-is-a-woman-she-is-a-warrior",
    date: "2020-06-10",
    title: "She is a woman, She is a warrior",
    kind: "Verse",
    text: `It never mattered how many ups or downs were there
'cause for it's counter her smile is always there.
Never ever try to judge that beautiful face on complexion,
'cause it never really matters if its more dark or less fair.

She always try to keep possession of every single bit,
And you know what she never really complain about anything.
She tries out 100% to give almost everything to her near ones,
But in return what does she gets isn't near even 1% of gaining.

Never try to compare her tears with even a single bit of weakness,
'cause you don't know how much she is stronger than the rock.
She always tries to keeps her pains inside herself,
And for your surprise she always keeps smile on herself.

It's never right and it won't be right ever to make her feel impure,
So what's the matter in this world if she bleeds.
She is the only one who could give birth to a new life,
And always tries to take care of everyone's needs in surprise.

Till date her character has been always judged by virginity,
What if she goes on night outs, she don't need to stay back.
'cause you know what the real problem is not in her clothes,
It's that pitiful mind of this sinister society that you lack.

She has always been and she will always be a pure sunshine,
Just like the sun in summer everyday she gets even more brighter.
Yes in this world being a human she is also tired sometimes,
But you know what always put your trust in her 'cause she is a fighter.

She has always been and will always be the pride of this world,
Never ever try to think ever in this world that she is an inferior.
'cause you have always known her from inside who she was and who she is,
In this pitiful and merciless world
She is a woman, She is a warrior.`,
  },
  {
    slug: "yours-forever",
    date: "2020-02-09",
    title: "Yours Forever",
    kind: "Verse",
    lede: "I mean it when I say I’m yours forever.",
    text: `I was forever torn apart,
You came to mend my broken heart.
You sewed the shattered pieces together,
Also filled the gap with new promises of forever.

True love didn't exist was my thought,
But I couldn't resist when you caught.
Our souls were colliding, You saw the real me,
In your eyes, I finally started appreciating me for me.

You made me see thing as they were meant to be,
You love me for me, which I never thought,
I would ever feel or see.

Me and my heart is yours forever,
The bonds between us will never break or tether.
For now, I can love anyone in any way I want to,
But I'd rather love you, for it is strong and more true.

For today I came to know true happiness,
Without even a slight feeling of emptiness.
I know I've never loved anyone before,
but the love we have is something more.

I'm yours as long as you want me,
and you're mine too as you see.
I'm your king, you're my queen,
No other love shall come in between.

No other love can either destroy this love or conquer,
Neither fight, nor send any force from above.
My love for you has filled my heart's empty core ever,
I mean it when I say, "I am yours forever".`,
  },
  {
    slug: "fallen-in-love",
    date: "2020-02-08",
    title: "Fallen in Love",
    kind: "Verse",
    lede: "To the girl who made me fall in love again.",
    text: `Lots of surprises come in our life,
People say breakup hurts life, yes it does indeed;
But it takes a great courage to forget every deeds,
And move on with heavy heart in life.

For me trusting someone has never been an easy task,
Wrong choices were made, my heart suffered in a flask.
But the moment I met you,
I couldn’t take away my eyes from you.

Those days were amazing due to your presence,
Reason, I attended class was your essence.
My favorite time was to gaze at you,
From where I sat in the corner opposite to you.

I often used to speak with you,
But I often got lost in you.
When you weren’t there due to any reason,
My eyes always searched for you whole season.

My words also had only one name,
And that was yours for some reason.
As my constant support, You were my best friend,
You made me fall in love with you, amidst other friends.

I just hope that you be on my side ever,
I wouldn’t promise forever, neither I have seen future
Nor have you seen it ever.
But I assure you we will be happy together,
Our fate has lot to tell us ever.
So let’s wait and enjoy the journey of life together,
And this life have something different for us never.`,
    coda: "One who craves for you.",
  },
  {
    slug: "fearful-girl",
    date: "2019-06-14",
    title: "Fearful Girl",
    kind: "Verse",
    lede: "When will she become fearless?",
    text: `One day a girl opened her cupboard,
looking for a short dress like a bird.
She couldn't find it;
She asked mom about her dress,
Mom showed her a news which was fresh
10 years old girl wearing shorts raped
But the rapists had escaped.

She changed to 3/4ths and full sleeves
Now more were her cloths, less were her skin
She assured that her dress wasn't too short
She assured that her neckline wasn't too deep
and the gap between her thighs wasn't too steep
Again a news came which dove into her deep
25 years old wearing burkha was raped
The news channel over the country aired
And yet again the rapists escaped.

She stopped stepping out alone in night
She avoided all the roads without streetlights
She started preferring day-shifts
She started taking pre-occupied lifts
She started pooling uber rides
And taking bus seats in extreme sides.
Again a news came like a tide
The public transport also became unsafe
It was 16th of December, the Nirbhaya case.

The people started screeming for justice
They protested and candle marched
But the accused were not charged
after some time, she died
But one won: "Justice delayed is not justice denied".

It didn't stopped after this
The human in him died
When he raped a mere 6 months old child
Whose parents had just went outside
Now, yes she could have tried to save her pride
Right?
No, you need to get up
And play same game of shame.

Her throat has dried, by screeming her resent
And the society's honour inside this body haunts her now…
We want her to feel free, to feel safe
I am just asking how?

We say we are a proud citizen
Yes we are a proud citizen
Of a Swachh Bharat
Of an Incredible India
But we hope it becomes
A Safe Bharat
A Surakshit India…

Because we are the land of fearless Rani Laxmi Bai,
Bachendri Pal, Kiran Bedi.
But also we are the land of fearful Asifas and Nirbhayas…`,
    coda: "Let's hope one day we live in India where females are considered no less than men and there is nothing to fear a female.",
  },
  {
    slug: "rest-in-peace",
    date: "2019-06-01",
    title: "Rest in Peace",
    kind: "Verse",
    lede: "The most painful goodbyes are one never said and never explained.",
    text: `If our tears could build a staircase
And our memories built a lane today.
We would be right now in heaven
And we would bring you back again
As I was on my way.

Farewell words were not said
Goodbyes were not said,
Before we knew, you went ahead.
And only god knew why
Why you left us to cry.

Sadness still resides in our heart,
Tears still flow through our eyes.
Losing you, what it felt like,
No one will ever know in life.

Even you are not among us,
But we know you want us
Not to mourn anymore.
But the happy times to be adored
As life still had a lot in it's store.

As you'll never be forgotten,
We pledge to you today.
A beautiful hallowed place,
Within our hearts for you
Is where you'll stay being you.`,
    coda: "We will always miss you, my dear friend.",
  },
  {
    slug: "why-me",
    date: "2019-05-24",
    title: "Why Me",
    kind: "Verse",
    lede: "An unborn baby story.",
    text: `My family is having my mother
A caring father, a big brother
But I was yet to come
Why me

One day God created me
I was like a dot on a page
But no one knew me
Why me

One day Mom came to know about me
My Dad came to know about me
My family was happy, but not me
Why me

Day by day there was growth in me
A tiny heart started functioning in me
Heart beats started in me
But my Mom can’t feel me
Why me

My small body parts began growing
A brain started developing in me
But still Mom couldn’t know me
Why me

One day sound started coming to me
Mom and Dad started giving names to me
But still I wasn’t happy
Why me

Milk teeth started to grow in me
But my eyes were still closed
I was excited to see you Mom
But couldn’t see how you looked
Why me

One day I started kicking
But I was too small for kicking
My Mom couldn’t feel me
Why me

Day by day I started getting stronger
I was just about able to see
But there was darkness around me
Why me

One day doctors scanned me
Found that I was a girl
That moment was unforgettable for me
But no one was happy except me
Why me

One day I felt something hurting me
I yelled, but nothing came out through me
Suddenly darkness started evolving around me
All pain has vanished from me
They aborted me
My Mom and Dad killed me
But I still wonder
Why me…`,
    coda: "Why me? Just because I was not a boy, I was a girl, so you killed me. See, now I am sitting in heaven in God’s lap, but it would have been more better if the lap was your’s, Mom.",
  },
];

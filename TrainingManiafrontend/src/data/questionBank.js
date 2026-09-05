// MCQ Pool with Correct Answers
export const mcqPool = [
  {
    question: "According to the video, how many fundamental things do you need to consider when setting up a WordPress website?",
    options: ["Two", "Three", "Four", "Five"],
    correctAnswer: "Three"
  },
  {
    question: "What are the three fundamental things mentioned?",
    options: ["Hosting, Domain, Email", "Content, Structure, Design", "Images, Videos, Text", "Speed, Security, SEO"],
    correctAnswer: "Content, Structure, Design"
  },
  {
    question: 'What is the length of the "Quick Start Guide" mentioned in the video?',
    options: ["200 seconds", "250 seconds", "300 seconds", "500 seconds"],
    correctAnswer: "250 seconds"
  },
  {
    question: "What theme is being used in this tutorial?",
    options: ["Twenty Twenty-Three", "Twenty Twenty-Four", "Twenty Twenty-Five", "Astra"],
    correctAnswer: "Twenty Twenty-Four"
  },
  {
    question: "How does every WordPress website start its life according to the speaker?",
    options: ["By choosing a domain", "By creating posts", "By creating structure (pages)", "By installing plugins"],
    correctAnswer: "By creating structure (pages)"
  },
  {
    question: "What is the name of the very first page the speaker creates?",
    options: ["About", "Contact", "Home", "Blog"],
    correctAnswer: "Home"
  },
  {
    question: "Which of the following is NOT a page created by the speaker in the example?",
    options: ["About", "Contact Us", "Shop", "Our Services"],
    correctAnswer: "Shop"
  },
  {
    question: "By default, in what order do published pages appear on the website menu?",
    options: ["Date created", "Numerical order", "Alphabetical order", "Reverse alphabetical order"],
    correctAnswer: "Alphabetical order"
  },
  {
    question: 'To fix the menu order, which option under "Appearance" does the speaker click?',
    options: ["Themes", "Customize", "Menus", "Editor"],
    correctAnswer: "Editor"
  },
  {
    question: "Inside the Editor, which section is selected to change the menu order?",
    options: ["Styles", "Navigation", "Pages", "Patterns"],
    correctAnswer: "Navigation"
  },
  {
    question: 'How does the speaker move the "Home" page to the top of the menu?',
    options: ['By numbering it "1"', "By deleting other pages", "By dragging and dropping it", 'By renaming it "AHome"'],
    correctAnswer: "By dragging and dropping it"
  },
  {
    question: "What specific alert message appears when the speaker tries to drag a menu item?",
    options: ['"Confirm deletion"', '"You are editing the menu"', '"Permission denied"', '"Network error"'],
    correctAnswer: '"You are editing the menu"'
  },
  {
    question: 'How can you remove an unwanted menu item (like "Sample Page")?',
    options: ["Right-click and delete", "Click the three little dots and select delete/remove", "Drag it off the screen", "Unpublish the page"],
    correctAnswer: "Click the three little dots and select delete/remove"
  },
  {
    question: "What button must be clicked at the bottom of the editor to finalize menu changes?",
    options: ["Save Change", "Publish", "Review one change", "Update Menu"],
    correctAnswer: "Save Change"
  },
  {
    question: "By default, what does the front page of a new WordPress site show?",
    options: ["A blank page", 'The "Home" page', "The blog (latest posts)", "An error message"],
    correctAnswer: "The blog (latest posts)"
  },
  {
    question: 'To set the homepage, you must go to "Settings" and click on:',
    options: ["General", "Writing", "Reading", "Permalinks"],
    correctAnswer: "Reading"
  },
  {
    question: 'In the Reading settings, "Your homepage displays" should be changed to:',
    options: ["Your latest posts", "A static page", "A custom link", "A slideshow"],
    correctAnswer: "A static page"
  },
  {
    question: "If you want a blog, which setting must be configured alongside the Homepage?",
    options: ["Writing page", "Posts page", "Comments page", "Media page"],
    correctAnswer: "Posts page"
  },
  {
    question: 'Which page did the speaker select as the "Posts page"?',
    options: ["News", "Articles", "Blog", "Updates"],
    correctAnswer: "Blog"
  },
  {
    question: 'What feature does the speaker use to add content "really quickly"?',
    options: ["Coding manually", "Patterns", "AI Writing", "Uploading a PDF"],
    correctAnswer: "Patterns"
  },
  {
    question: "Where can the Patterns option be found in the editor?",
    options: ["Under Settings", "In the top-left block inserter menu", "In the footer", 'Under "Tools"'],
    correctAnswer: "In the top-left block inserter menu"
  },
  {
    question: 'After adding patterns, how many "seconds" did the speaker joke it took to make a brand new homepage?',
    options: ["2 seconds", "10 seconds", "60 seconds", "5 minutes"],
    correctAnswer: "60 seconds"
  },
  {
    question: 'The speaker removed the page title "Home" from the visible page. Why?',
    options: ["It was spelled wrong", "It clashed with the design", "He prefers no titles", "(Reason implies aesthetics)"],
    correctAnswer: "It clashed with the design"
  },
  {
    question: 'To remove the "Home" title text, the speaker swapped the:',
    options: ["Theme", "Template", "Header", "Font"],
    correctAnswer: "Template"
  },
  {
    question: "Which specific template did the speaker select to hide the title?",
    options: ["Blank Canvas", "Full Width", "Page No Title", "Front Page"],
    correctAnswer: "Page No Title"
  },
  {
    question: "To customize the design (fonts and colors), which section in the Editor is used?",
    options: ["Patterns", "Styles", "Templates", "Parts"],
    correctAnswer: "Styles"
  },
  {
    question: 'Are the style changes shown in the video "local" (one page only) or "global"?',
    options: ["Local", "Global", "Temporary", "Hidden"],
    correctAnswer: "Global"
  },
  {
    question: 'When changing styles, what is meant by "Preset Variations"?',
    options: ["You can only use black and white", "Different pre-made color and font combinations", "You have to buy new themes", "It only changes the logo"],
    correctAnswer: "Different pre-made color and font combinations"
  },
  {
    question: "Can you change the typography (fonts) independently of the color palette?",
    options: ["Yes", "No", "Only on the contact page", "Only if you pay"],
    correctAnswer: "Yes"
  },
  {
    question: 'What color is the final "Save" button located at the top right (in Editor) or bottom (in Reading settings)?',
    options: ["Red", "Green", "Blue", "Black"],
    correctAnswer: "Blue"
  }
];

// Fill in the Blanks Pool with Answers
export const fibPool = [
  { question: "There are fundamentally just three things to consider: Content, Structure, and _______.", answer: "Design" },
  { question: "The quick start guide is exactly _______ seconds long.", answer: "250" },
  { question: "Every WordPress website starts life by creating the _______ (via pages).", answer: "Structure" },
  { question: 'To add a new page, you click on "_______" then write the title.', answer: "Add New" },
  { question: "The list of pages created includes Home, _______, Contact Us, Blog, and Our Services.", answer: "About" },
  { question: "Newly published pages appear at the top of the website in _______ order.", answer: "Alphabetical" },
  { question: 'To access the "Editor", you must go to the dashboard and hover over _______.', answer: "Appearance" },
  { question: "In the Editor, you click on _______ to fix the menu order.", answer: "Navigation" },
  { question: "You can arrange the menu by _______ and dropping the items.", answer: "Dragging" },
  { question: 'When dragging a menu item, a dialog box warns that you are "_______ the menu".', answer: "Editing" },
  { question: "You can remove menu items by clicking on the _______ little dots.", answer: "Three" },
  { question: 'After arranging the menu, you must click "Review _______ change".', answer: "One" },
  { question: "By default, the _______ page is shown on the front page of the website.", answer: "Posts" },
  { question: "To fix the homepage view, go to Dashboard > Settings > _______.", answer: "Reading" },
  { question: 'In the Reading settings, you switch "Your homepage displays" from "Your latest posts" to a _______ page.', answer: "Static" },
  { question: 'For the "Homepage" dropdown, the speaker selects the page titled _______.', answer: "Home" },
  { question: 'For the "Posts page" dropdown, the speaker selects the page titled _______.', answer: "Blog" },
  { question: "After selecting the pages in Reading settings, you must click _______ Changes.", answer: "Save" },
  { question: "Before adding content, the Home page is technically _______ (has no content).", answer: "Blank" },
  { question: 'When you click on the "Blog" menu item, it automatically shows all your _______.', answer: "Posts" },
  { question: "To add content quickly, the speaker uses the _______ that come with the theme.", answer: "Patterns" },
  { question: "The theme used in the video is called Twenty _______.", answer: "Twenty-Four" },
  { question: "The speaker zooms out by clicking the small _______ icon at the top.", answer: "Magnifying glass" },
  { question: 'To remove the page title "Home", you need to swap the _______.', answer: "Template" },
  { question: 'The specific template selected to remove the header text is called "Page _______ Title".', answer: "No" },
  { question: 'The "Styles" option allows you to customize the _______ of the website.', answer: "look" },
  { question: "The style options are found in the Appearance > _______ section.", answer: "Editor" },
  { question: "Preset styles allow you to change the entire _______ and _______ of the site at once.", answer: "Color, Typography" },
  { question: "If you like a dark background but want a different font, you can change the _______ independently.", answer: "Typography" },
  { question: 'The "Save changes" button generally appears in the color _______.', answer: "Blue" },
  { question: "At the end of the video, the speaker asks viewers to hit the _______ button if they found the video useful.", answer: "Like" }
];

// Short Answer Pool
export const shortAnswerPool = [
  { question: "Explain the three fundamental things required to set up a WordPress website.", answer: "The three things are Content (text/images), Structure (pages/menu), and Design (look/feel)." },
  { question: "Describe the process of changing the homepage from a blog feed to a static page.", answer: "Go to Settings > Reading, change 'Your homepage displays' to 'A static page', and select 'Home' for Homepage and 'Blog' for Posts page." },
  { question: "What is the purpose of using Patterns in the WordPress Editor?", answer: "Patterns allow users to quickly insert pre-designed layouts and content sections instead of building everything from scratch." },
  { question: "Why did the speaker change the page template to 'Page No Title'?", answer: "To hide the default page title 'Home' that appeared at the top of the design, which clashed with the desired aesthetic." },
  { question: "How does the Global Styles feature in WordPress affect the website?", answer: "Global Styles apply changes to typography, colors, and layout across the entire website simultaneously, ensuring consistency." }
];

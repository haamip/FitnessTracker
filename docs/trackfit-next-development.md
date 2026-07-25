# TrackFit next development

## Workout experience

- Remove exercise pictures from the active workout and workout detail experience.
- Keep the workout UI clean and text-first.
- Replace interval-only workout timing with timestamp-based timing so elapsed time remains accurate when the screen is locked, the tab is backgrounded, or the app is minimised.
- Persist the active workout timing state so it can recover after refresh or reopening the app.
- At workout completion, show the calculated duration and allow the user to edit the start time, end time, or total duration before saving.
- Allow the duration of a saved workout to be corrected later from workout history/details.

## Workout import

Add an **Import workout** entry point in Train.

Supported MVP inputs:

1. Paste workout text.
2. Upload a text-based PDF.

Flow:

`Train -> Import workout -> Paste text or upload PDF -> Parse -> Review and edit -> Save`

The parsed workout must be shown as an editable draft before it is saved. The importer should attempt to identify:

- Workout/program title
- Exercise names
- Sets
- Reps or rep ranges
- Rest periods
- Exercise notes
- Workout days when the input contains a multi-day program

Build the text importer first, with the PDF importer feeding extracted text through the same parser.

## Suggested delivery order

1. Remove exercise pictures.
2. Add timestamp-based persistent timer.
3. Add editable workout start/end time and duration.
4. Add Train import entry point and pasted-text review flow.
5. Add PDF text extraction using the same import pipeline.

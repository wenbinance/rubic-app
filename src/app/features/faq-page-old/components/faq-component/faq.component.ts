import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Self } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Question } from '../../models/question';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, fromEvent } from 'rxjs';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
  providers: [TuiDestroyService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FaqComponent implements AfterViewInit {
  public questions: Question[] = [];

  private hash: string;

  constructor(
    private readonly translateService: TranslateService,
    private readonly route: ActivatedRoute,
    private readonly element: ElementRef,
    @Self() private readonly destroy$: TuiDestroyService
  ) {
    combineLatest([this.route.fragment, this.translateService.stream('faqPage.questions')])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([hash, questions]) => {
        this.hash = hash;
        this.questions = questions.map(
          (question: { title: string; answer: string; id: string }) => ({
            ...question,
            isActive: hash === question.id,
            id: question.id
          })
        );
      });
  }

  public ngAfterViewInit(): void {
    if (this.hash) {
      const answerElement = this.element.nativeElement.querySelector(`#${this.hash}`);

      if (!answerElement) return;

      answerElement.scrollIntoView({
        behavior: 'smooth'
      });
      fromEvent(document, 'scroll')
        .pipe(debounceTime(50), takeUntil(this.destroy$))
        .subscribe(() => {
          answerElement.classList.add('questions-container__question_highlight');
        });
    }
  }

  public toggleQuestion(question: Question): void {
    question.isActive = !question.isActive;
  }
}

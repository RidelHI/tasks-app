import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

export interface ConfirmDialogData {
  title: string;
  message: string;
  /** Label of the button that confirms, naming the action (e.g. "Delete"). */
  confirmLabel: string;
}

/**
 * Asks the user to confirm a destructive action. Focus starts on Cancel, so pressing Enter by
 * accident does not destroy anything.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatButton, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton type="button" [mat-dialog-close]="false">Cancel</button>
      <button matButton="filled" type="button" class="danger" [mat-dialog-close]="true">
        {{ data.confirmLabel }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    @use '@angular/material' as mat;

    p {
      margin: 0;
    }

    .danger {
      @include mat.button-overrides(
        (
          filled-container-color: var(--mat-sys-error),
          filled-label-text-color: var(--mat-sys-on-error),
        )
      );
    }
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}

/** Opens a confirmation dialog; resolves to `true` only if the user confirms. */
export async function confirm(dialog: MatDialog, data: ConfirmDialogData): Promise<boolean> {
  const dialogRef = dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
    data,
    role: 'alertdialog',
    // Cancel is the first tabbable element: it gets the focus.
    autoFocus: 'first-tabbable',
    width: '400px',
  });
  return (await firstValueFrom(dialogRef.afterClosed())) === true;
}

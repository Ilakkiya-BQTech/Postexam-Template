import React, { useState,useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import pdfFile from "./Exampaper.pdf"
import "./PDFViewer.css"
import { FaCheck, FaTimes } from 'react-icons/fa';
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PDFViewer = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [visitedPages, setVisitedPages] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [draggedCircle, setDraggedCircle] = useState(null);
  // const [lastClickTime, setLastClickTime] = useState(0);
  const [circles, setCircles] = useState([]);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [pdfDocument, setPdfDocument] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [deleteButtonVisible, setDeleteButtonVisible] = useState(false);
  const [selectedCopiedCircle, setSelectedCopiedCircle] = useState(null);
  const [deleteButtonPosition, setDeleteButtonPosition] = useState({ x: 0, y: 0 });
  const handleCopiedCircleClick = (circleId) => {
    setSelectedCopiedCircle(circleId);
    setDeleteButtonVisible(true);
  };
  const pdfRef = useRef(null);
  const handlePageChange = (newPage) => {
    setPageNumber(newPage);
    setVisitedPages((prevVisitedPages) => {
      if (!prevVisitedPages.includes(newPage)) {
        return [...prevVisitedPages, newPage];
      }
      return prevVisitedPages;
    });
  };
  const handleMouseDown = (num, e) => {
    setDraggedCircle(num);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
  };
  
  const handleDownloadPDF = async () => {
    try {
      const pdfDocument = await pdfjs.getDocument(pdfFile).promise;

      // Iterate over annotations and add them to corresponding pages
      annotations.forEach((annotation) => {
        const pageIndex = annotation.pageNumber - 1;

        if (pageIndex >= 0 && pageIndex < pdfDocument.numPages) {
          const pdfPage = pdfDocument.getPage(pageIndex + 1);

          // Example: Add text annotation
          const textAnnotation = new pdfjs.Annotation.Text({
            rect: [annotation.x, annotation.y, annotation.x + 20, annotation.y + 10],
            contents: annotation.number.toString(),
          });

          pdfPage.addAnnotation(textAnnotation);
        }
      });

      // Generate blob and download
      const data = await pdfDocument.getData();
      const blob = new Blob([data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'annotated_pdf.pdf';
      link.click();
    } catch (error) {
      console.error('Error generating PDF blob:', error);
    }
  };
  
  const handleMouseUp = (e) => {
    if (draggedCircle !== null) {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
  
      // Create a copy of the dragged circle
      const copiedCircle = document.createElement('div');
      const circleId = new Date().getTime();
      copiedCircle.id = `copied-circle-${circleId}`;
      copiedCircle.className = 'circle-marker copied';
      copiedCircle.innerHTML = `<div class="marker-number">${draggedCircle}</div>`;
      copiedCircle.style.position = 'absolute';
      copiedCircle.style.left = `${mouseX}px`;
      copiedCircle.style.top = `${mouseY}px`;
  
      copiedCircle.addEventListener('click', () => handleCopiedCircleClick(circleId));
      const pdfContainer = document.querySelector('.pdf-container');
      if (pdfContainer) {
        pdfContainer.appendChild(copiedCircle);
  
       
        const deleteButton = document.createElement('div');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = 'Delete';
        deleteButton.style.position = 'absolute';
        deleteButton.style.left = `${mouseX}px`;
        deleteButton.style.top = `${mouseY + 30}px`; // Adjust the position as needed
  
       
        deleteButton.addEventListener('click', () => handleDeleteButtonClick(circleId));
  
       
        pdfContainer.appendChild(deleteButton);
      }
  
      setDraggedCircle(null);
      setDragStartPos({ x: 0, y: 0 });
    }
  };

  const handleDeleteButtonClick = (circleId) => {
    // Handle the delete button click and remove the corresponding circle
    const copiedCircleToRemove = document.getElementById(`copied-circle-${circleId}`);
    const deleteButtonToRemove = document.querySelector('.delete-button');
    
    if (copiedCircleToRemove && deleteButtonToRemove) {
      copiedCircleToRemove.remove();
      deleteButtonToRemove.remove();
      
      setDeleteButtonVisible(false);
      setSelectedCopiedCircle(null);
      setDragStartPos({ x: 0, y: 0 });
    }
  };

  const handleZoomIn = () => {
    setZoom((prevZoom) => prevZoom + 0.5);
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.5, 0.5));
  };

  const handleFit = () => {
    setZoom(1);
  };

  const handleRotate = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  };

  const handleFirstPage = () => {
    setPageNumber(1);
  };

  const handleLastPage = () => {
    setPageNumber(totalPages);
  };

  const onLoadSuccess = ({ numPages }) => {
    setTotalPages(numPages);
    setPdfDocument(pdfRef.current.pdfDocument);
  };

  const renderPageIndicator = () => {
    const circles = [];
    for (let i = 1; i <= 42; i++) {
      const isVisited = visitedPages.includes(i);
      circles.push(
        <div
          key={i}
          className={`page-indicator-circle ${isVisited ? 'visited' : ''} ${pageNumber === i ? 'active' : ''
            }`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </div>
      );
    }
    return circles;
  };
  const renderAnnotationSection = () => {
    const handleButtonMouseDown = (type, e) => {
      const buttonType = type === 'tick' ? '✔' : '✘';
      setDraggedCircle(buttonType);
      setDragStartPos({ x: e.clientX, y: e.clientY });
    };

    const handleButtonMouseUp = (e) => {
      if (draggedCircle) {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
  
        // Create a copy of the dragged button
        const copiedButton = document.createElement('div');
        copiedButton.className = 'copied-button';
        copiedButton.innerHTML =
          draggedCircle === '✔' ? (
            <FaCheck className="icon" style={{ color: 'green' }} />
          ) : (
            <FaTimes className="icon" style={{ color: 'red' }} />
          );
        copiedButton.style.position = 'absolute';
        copiedButton.style.left = `${mouseX}px`;
        copiedButton.style.top = `${mouseY}px`;
  
        // Append the copied button to the annotation section
        document.querySelector('.annotation-section').appendChild(copiedButton);
  
        setDraggedCircle(null);
        setDragStartPos({ x: 0, y: 0 });
      }
      
    };
    return (
      <div className="annotation-section" onMouseUp={handleButtonMouseUp}>
        <div className="annotation-heading">Annotation</div>
        <div className="numbered-circles">
       
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <div
              key={num}
              id={`circle-${num}`}
              className="circle-marker"
              onMouseDown={(e) => handleMouseDown(num, e)}
            // style={{ position: 'absolute', left: `${num * 30}px`, top: '30px' }}
            >
              <div className="marker-number">{num}</div>
            </div>
          ))}
        </div>


        <div className="marker-buttons">
          <div className="button" onMouseDown={(e) => handleButtonMouseDown('tick', e)}>
            <FaCheck className="icon" style={{ color: 'green' }} />
          </div>
          <div className="button" onMouseDown={(e) => handleButtonMouseDown('cross', e)}>
            <FaTimes className="icon" style={{ color: 'red' }} />
          </div>
        </div>
        {deleteButtonVisible && (
          <div
            className="delete-button"
            onClick={handleDeleteButtonClick}
            style={{ left: deleteButtonPosition.x, top: deleteButtonPosition.y }}
          >
            Delete
          </div>
        )} 
      </div>

    );
  };
  return (
    <div className="pdf-viewer-container">

      <div className="page-indicator">{renderPageIndicator()}</div>

      <div className="page-controls">
        <button onClick={handleFirstPage} disabled={pageNumber === 1}>
          First
        </button>
        <button onClick={() => handlePageChange(pageNumber - 1)} disabled={pageNumber === 1}>
          Previous
        </button>
        <button onClick={() => handlePageChange(pageNumber + 1)} disabled={pageNumber === 42}>
          Next
        </button>
        <button onClick={handleLastPage} disabled={pageNumber === 42}>
          Last
        </button>
      </div>
      <div className="pdf-viewer" onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}>

        <div className='pdf-container'>
          <Document file={pdfFile} onLoadSuccess={onLoadSuccess} ref={pdfRef}>
            <Page pageNumber={pageNumber} scale={zoom} rotate={rotation} />
          </Document>
        </div>
        <div className="annotation-section">
          {renderAnnotationSection()}
        </div>
      </div>
      <div className="zoom-rotate-controls">
        <button onClick={handleZoomIn}>Zoom In</button>
        <button onClick={handleZoomOut}>Zoom Out</button>
        <button onClick={handleFit}>Fit</button>
        <button onClick={handleRotate}>Rotate</button>
        <div className="submit-button">
        <button onClick={handleDownloadPDF}>Submit</button>
      </div>

      </div>
    </div>
  );
};

export default PDFViewer;

